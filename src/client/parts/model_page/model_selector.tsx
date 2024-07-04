import {Button} from "client/components/button/button"
import {useAlert} from "client/components/modal/alert_modal"
import {useRoutingContext} from "client/components/router/routing_context"
import {MappedNamedIdTreeView} from "client/components/tree_view/mapped_named_id_tree_view"
import {CentralColumn} from "client/parts/layouts/central_column"
import {useProject} from "client/parts/project_context"
import {useTextures} from "client/parts/texture_tree_context"
import {AbortError} from "client/ui_utils/abort_error"
import {appendUrlPath, pushHistory} from "client/ui_utils/urls"
import {TreePath, mapTree} from "common/tree"
import {getHashUUID, getRandomUUID} from "common/uuid"
import {UUID} from "crypto"
import {NamedId, Project, ProjectModel, makeBlankModel} from "data/project"
import {getTreePathStr} from "data/project_utils"
import {Icon} from "generated/icons"

const findDefaultId = (values: NamedId[]): UUID | null => {
	return values.find(value => value.name === "default")?.id ?? values[0]?.id ?? null
}

export const ModelSelector = () => {
	const [project, setProject] = useProject()
	const {textureFiles} = useTextures()
	const {matchedUrl} = useRoutingContext()
	const {showAlert} = useAlert()

	const getModelWithDefaults = (): ProjectModel => {
		let collisionGroupId = findDefaultId(project.collisionGroups)
		if(!collisionGroupId){
			const id = collisionGroupId = getRandomUUID()
			setProject(project => ({
				...project,
				collisionGroups: [...project.collisionGroups, {id, name: "default"}]
			}))
		}

		let layerId = findDefaultId(project.layers.filter(layer => layer.type === "model"))
		if(!layerId){
			const id = layerId = getRandomUUID()
			setProject(project => ({
				...project,
				layers: [...project.layers, {id, name: "default", type: "model"}]
			}))
		}

		const textureId = findDefaultId(textureFiles)
		if(!textureId){
			void showAlert({
				body: "Cannot add a model: there are no textures in the project, and model must have a texture. Add a texture first."
			})
			throw new AbortError("Insufficient data.")
		}

		return makeBlankModel({collisionGroupId, layerId, textureId})
	}

	const onModelCreated = (name: string, path: TreePath) => {
		const pathStr = getTreePathStr(project.modelTree, path.slice(0, -1), name)
		const model = getModelWithDefaults()
		setProject(project => ({
			...project,
			models: {...project.models, [pathStr]: model}
		}))
		return {name, id: model.id}
	}

	return (
		<CentralColumn>
			<MappedNamedIdTreeView
				isSearchable
				values={project.modelTree}
				toTree={(node, index) => mapTree(node,
					(name, path) => {
						const pathStr = getTreePathStr(project.modelTree, path)
						const model = project.models[pathStr]!
						return {id: model.id, name}
					},
					(name, path) => {
						const pathStr = getTreePathStr(project.modelTree, path, undefined, "branch")
						return {id: getHashUUID(pathStr), name}
					},
					index
				)}
				fromTree={node => mapTree(node, namedId => namedId.name, namedId => namedId.name)}
				onChange={modelTree => setProject(project => ({...project, modelTree}))}
				canBeChildOf={() => true}
				buttons={controls => (
					<>
						<Button text="Add directory" icon={Icon.folderPlus} onClick={() => controls.addRenameBranch()}/>
						<Button
							text="Add model"
							icon={Icon.filePlus}
							onClick={() => controls.addRenameLeaf()}
						/>
					</>
				)}
				onLeafCreated={onModelCreated}
				onBranchCreated={(name, path) => {
					const pathStr = getTreePathStr(project.modelTree, path.slice(0, -1), name, "branch")
					return {id: getHashUUID(pathStr), name}
				}}
				onLeafDelete={(_, path) => setProject(project => {
					const models = {...project.models}
					const pathStr = getTreePathStr(project.modelTree, path)
					delete models[pathStr]
					return {...project, models}
				})}
				onLeafDoubleclick={namedId => pushHistory(appendUrlPath(matchedUrl, `./${namedId.id}`))}
				beforeBranchRename={(_, name, path) => setProject(project => {
					const oldPrefix = getTreePathStr(project.modelTree, path, undefined, "branch")
					const newPrefix = getTreePathStr(project.modelTree, path.slice(0, -1), name, "branch")
					const models: Project["models"] = {}
					for(const [oldModelPath, model] of Object.entries(project.models)){
						let modelPath = oldModelPath
						if(modelPath.startsWith(oldPrefix)){
							modelPath = newPrefix + modelPath.substring(0, oldPrefix.length)
						}
						models[modelPath] = model
					}
					return {...project, models}
				})}
				beforeLeafRename={(_, name, path) => setProject(project => {
					const models = {...project.models}
					const oldPathStr = getTreePathStr(project.modelTree, path)
					const model = models[oldPathStr]!
					delete models[oldPathStr]
					const newPathStr = getTreePathStr(project.modelTree, path.slice(0, -1), name)
					models[newPathStr] = model
					return {...project, models}
				})}
			/>
		</CentralColumn>
	)
}
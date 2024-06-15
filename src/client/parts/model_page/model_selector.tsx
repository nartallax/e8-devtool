import {Button} from "client/components/button/button"
import {AlertModal} from "client/components/modal/alert_modal"
import {useRoutingContext} from "client/components/router/routing_context"
import {MappedNamedIdTreeControls, MappedNamedIdTreeView} from "client/components/tree_view/mapped_named_id_tree_view"
import {CentralColumn} from "client/parts/layouts/central_column"
import {useProject} from "client/parts/project_context"
import {useTextures} from "client/parts/texture_tree_context"
import {AbortError} from "client/ui_utils/abort_error"
import {appendUrlPath, pushHistory} from "client/ui_utils/urls"
import {mapTreeLeaves} from "common/tree"
import {getRandomUUID} from "common/uuid"
import {UUID} from "crypto"
import {NamedId, ProjectModel} from "data/project"
import {Icon} from "generated/icons"
import {useState} from "react"

const findDefaultId = (values: NamedId[]): UUID | null => {
	return values.find(value => value.name === "default")?.id ?? values[0]?.id ?? null
}

export const ModelSelector = () => {
	const [project, setProject] = useProject()
	const {textureFiles} = useTextures()
	const modelMap = new Map(project.models.map(model => [model.id, model]))
	const {matchedUrl} = useRoutingContext()

	const [alertText, setAlertText] = useState("")
	const getModelWithDefaults = (): ProjectModel | null => {
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
			setAlertText("Cannot add a model: there are no textures in the project, and model must have a texture. Add a texture first.")
			return null
		}

		return {
			id: getRandomUUID(),
			layerId,
			collisionGroupId,
			name: "unnamed model",
			size: {x: 1, y: 1},
			textureId,
			isStatic: false,
			shapes: []
		}
	}

	const onAddModel = (controls: MappedNamedIdTreeControls<NamedId, NamedId>) => {
		const model = getModelWithDefaults()
		if(model){
			setProject(project => ({
				...project,
				models: [...project.models, model]
			}))
			controls.addRenameLeaf({id: model.id})
		}
	}

	const onAddModelToDirectory = () => {
		const model = getModelWithDefaults()
		if(model){
			setProject(project => ({
				...project,
				models: [...project.models, model]
			}))
			return {id: model.id}
		}
		throw new AbortError("Cannot create a model.")
	}

	return (
		<CentralColumn>
			{alertText && <AlertModal header="Error" body={alertText} onClose={() => setAlertText("")}/>}
			<MappedNamedIdTreeView
				isSearchable
				values={project.modelTree}
				toTree={node => mapTreeLeaves(node, id => ({id, name: modelMap.get(id)!.name}))}
				fromTree={node => mapTreeLeaves(node, namedId => namedId.id)}
				onChange={modelTree => setProject(project => ({...project, modelTree}))}
				canBeChildOf={() => true}
				buttons={controls => (
					<>
						<Button text="Add directory" icon={Icon.folderPlus} onClick={() => controls.addRenameBranch({})}/>
						<Button
							text="Add model"
							icon={Icon.filePlus}
							onClick={() => onAddModel(controls)}
						/>
					</>
				)}
				makeNewChild={onAddModelToDirectory}
				onLeafCreateCancel={id => setProject(project => ({
					...project,
					models: project.models.filter(model => model.id !== id)
				}))}
				onLeafDelete={leaf => setProject(project => ({
					...project,
					models: project.models.filter(model => model.id !== leaf.id)
				}))}
				onLeafDoubleclick={namedId => pushHistory(appendUrlPath(matchedUrl, `./${namedId.id}`))}
				onLeafRename={(namedId, name) => setProject(project => {
					const models = project.models.map(model => {
						if(model.id !== namedId.id){
							return model
						}
						return {...model, name}
					})
					return {...project, models}
				})}
			/>
		</CentralColumn>
	)
}
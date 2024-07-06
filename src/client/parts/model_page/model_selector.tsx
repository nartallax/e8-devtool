import {useAlert} from "client/components/modal/alert_modal"
import {useRoutingContext} from "client/components/router/routing_context"
import {MappedForestView} from "client/components/tree_view/mapped_forest_view"
import {CentralColumn} from "client/parts/layouts/central_column"
import {useProject} from "client/parts/project_context"
import {useTextures} from "client/parts/texture_tree_context"
import {AbortError} from "client/ui_utils/abort_error"
import {appendUrlPath, pushHistory} from "client/ui_utils/urls"
import {filterObject} from "common/filter_object"
import {getRandomUUID} from "common/uuid"
import {UUID} from "crypto"
import {ProjectModel, makeBlankModel} from "data/project"
import {treePartsToPath} from "data/project_utils"

const findDefaultId = (values: Record<string, {id: UUID}>): UUID | null => {
	const entries = Object.entries(values)
	return entries.find(([key]) => key === "default")?.[1].id ?? entries[0]?.[1].id ?? null
}

const findDefaultTexture = (paths: string[]): string | null => paths[0] ?? null

export const ModelSelector = () => {
	const [project, setProject] = useProject()
	const {texturePaths} = useTextures()
	const {matchedUrl} = useRoutingContext()
	const {showAlert} = useAlert()

	const getModelWithDefaults = (): ProjectModel => {
		let collisionGroupId = findDefaultId(project.collisionGroups)
		if(!collisionGroupId){
			const id = collisionGroupId = getRandomUUID()
			setProject(project => ({
				...project,
				collisionGroupTree: [
					...project.collisionGroupTree,
					{value: "default"}
				],
				collisionGroups: {
					...project.collisionGroups,
					default: {id}
				}
			}))
		}

		let layerId = findDefaultId(filterObject(project.layers, (_, layer) => layer.type === "model"))
		if(!layerId){
			const id = layerId = getRandomUUID()
			setProject(project => ({
				...project,
				layers: {
					...project.layers,
					default: {id, type: "model"}
				}
			}))
		}

		const texturePath = findDefaultTexture(texturePaths)
		if(!texturePath){
			void showAlert({
				body: "Cannot add a model: there are no textures in the project, and model must have a texture. Add a texture first."
			})
			throw new AbortError("Insufficient data.")
		}

		return makeBlankModel({collisionGroupId, layerId, texturePath})
	}

	return (
		<CentralColumn>
			<MappedForestView
				getObjectKey={treePartsToPath}
				forest={project.modelTree}
				onForestChange={modelTree => setProject(project => ({...project, modelTree}))}
				mapObject={project.models}
				onMapChange={models => setProject(project => ({...project, models}))}
				createItem={getModelWithDefaults}
				itemName="model"
				onItemDoubleclick={model => {
					pushHistory(appendUrlPath(matchedUrl, `./${model.id}`))
				}}
			/>
		</CentralColumn>
	)
}
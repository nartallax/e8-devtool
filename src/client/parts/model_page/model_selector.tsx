import {useAlert} from "client/components/modal/alert_modal"
import {useRoutingContext} from "client/components/router/routing_context"
import {CentralColumn} from "client/parts/layouts/central_column"
import {useProject} from "client/parts/project_context"
import {StringForestMapObjectView} from "client/parts/string_tree_map_object_view/string_forest_map_object_view"
import {useTextures} from "client/parts/texture_tree_context"
import {AbortError} from "client/ui_utils/abort_error"
import {appendUrlPath, pushHistory} from "client/ui_utils/urls"
import {getRandomUUID} from "common/uuid"
import {UUID} from "crypto"
import {NamedId, ProjectModel, makeBlankModel} from "data/project"

const findDefaultId = (values: NamedId[] | Record<string, {id: UUID}>): UUID | null => {
	if(Array.isArray(values)){
		return values.find(value => value.name === "default")?.id ?? values[0]?.id ?? null
	}
	const entries = Object.entries(values)
	return entries.find(([key]) => key === "default")?.[1].id ?? entries[0]?.[1].id ?? null
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

	return (
		<CentralColumn>
			<StringForestMapObjectView
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
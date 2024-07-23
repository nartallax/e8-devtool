import {useRoutingContext} from "client/components/router/routing_context"
import {StringForestView} from "client/components/tree_view/string_forest_view"
import {collisionGroupProvider, layerProvider, modelProvider} from "client/parts/data_providers/data_providers"
import {CentralColumn} from "client/parts/layouts/central_column"
import {appendUrlPath} from "client/ui_utils/urls"
import {withDataLoaded} from "client/ui_utils/with_data_loaded"
import {filterMap} from "common/filter_object"
import {UUID, getRandomUUID} from "common/uuid"
import {ProjectModel, makeBlankModel} from "data/project"

const findDefaultId = (values: Map<string, {id: UUID}>): UUID | null => {
	const entries = [...values.entries()]
	return entries.find(([key]) => key === "default")?.[1].id ?? entries[0]?.[1].id ?? null
}

export const ModelSelector = withDataLoaded(
	() => ({
		collisionGroups: collisionGroupProvider.useAsMap(),
		layers: layerProvider.useAsMap()
	}),
	({collisionGroups, layers}) => {
		const {matchedUrl, navigate} = useRoutingContext()

		const {create: createCollisionGroup} = collisionGroupProvider.useFetchers()
		const {create: createLayer} = layerProvider.useFetchers()

		const getModelWithDefaults = (): ProjectModel => {
			let collisionGroupId = findDefaultId(collisionGroups)
			if(!collisionGroupId){
				collisionGroupId = getRandomUUID()
				void createCollisionGroup("default", 0, {
					id: collisionGroupId
				})
			}

			let layerId = findDefaultId(filterMap(layers, (_, layer) => layer.type === "model"))
			if(!layerId){
				layerId = getRandomUUID()
				void createLayer("default_layer", 0, {
					id: layerId,
					type: "model"
				})
			}

			return makeBlankModel({collisionGroupId, layerId})
		}

		const forestProps = modelProvider.useEditableForest({
			createItem: () => getModelWithDefaults()
		})
		const {getByPath} = modelProvider.useFetchers()

		if(!forestProps){
			return null
		}

		return (
			<CentralColumn>
				<StringForestView
					{...forestProps}
					itemName="model"
					onItemDoubleclick={async path => {
						const model = await getByPath(path)
						navigate(appendUrlPath(matchedUrl, `./${model.id}`))
					}}
				/>
			</CentralColumn>
		)
	})
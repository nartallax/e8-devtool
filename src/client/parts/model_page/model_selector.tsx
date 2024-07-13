import {useAlert} from "client/components/modal/alert_modal"
import {useRoutingContext} from "client/components/router/routing_context"
import {StringForestView} from "client/components/tree_view/string_forest_view"
import {UnsavedChanges} from "client/components/unsaved_changes_context/unsaved_changes_context"
import {collisionGroupProvider, layerProvider, modelProvider} from "client/parts/data_providers/data_providers"
import {CentralColumn} from "client/parts/layouts/central_column"
import {useTextures} from "client/parts/texture_tree_context"
import {AbortError} from "client/ui_utils/abort_error"
import {appendUrlPath, pushHistory} from "client/ui_utils/urls"
import {withDataLoaded} from "client/ui_utils/with_data_loaded"
import {filterMap} from "common/filter_object"
import {UUID} from "common/uuid"
import {ProjectModel, makeBlankModel} from "data/project"

const findDefaultId = (values: Map<string, {id: UUID}>): UUID | null => {
	const entries = [...values.entries()]
	return entries.find(([key]) => key === "default")?.[1].id ?? entries[0]?.[1].id ?? null
}

const findDefaultTexture = (paths: string[]): string | null => paths[0] ?? null

export const ModelSelector = withDataLoaded(
	() => ({
		collisionGroups: collisionGroupProvider.useAsMap(),
		layers: layerProvider.useAsMap()
	}),
	({collisionGroups, layers}) => {
		const {texturePaths} = useTextures()
		const {matchedUrl} = useRoutingContext()
		const {showAlert} = useAlert()

		const getModelWithDefaults = (): ProjectModel => {
			const collisionGroupId = findDefaultId(collisionGroups)
			if(!collisionGroupId){
				// TODO: create new collision group in this case
				void showAlert({
					body: "Cannot add a model: there are no collision groups in the project."
				})
				throw new AbortError("There are no collision groups in the project.")
			}

			const layerId = findDefaultId(filterMap(layers, (_, layer) => layer.type === "model"))
			if(!layerId){
				// TODO: create new layer group in this case
				void showAlert({
					body: "Cannot add a model: there are no layers in the project."
				})
				throw new AbortError("There are no layers in the project.")
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

		const {forestProps, changesProps} = modelProvider.useEditableForest({
			createItem: () => getModelWithDefaults()
		})
		const {getByPath} = modelProvider.useFetchers()

		return (
			<UnsavedChanges {...changesProps}>
				<CentralColumn>
					<StringForestView
						{...forestProps}
						itemName="model"
						onItemDoubleclick={async path => {
							await changesProps.save()
							const model = await getByPath(path)
							pushHistory(appendUrlPath(matchedUrl, `./${model.id}`))
						}}
					/>
				</CentralColumn>
			</UnsavedChanges>
		)
	})
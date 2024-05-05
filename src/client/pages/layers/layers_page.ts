import {ModelBoundNamedIdList} from "client/component/named_id_list/model_bound_named_id_list"
import {TwoColumnLayout} from "client/component/two_column_layout/two_column_layout"
import {showLayerCreateModal} from "client/pages/layers/layer_create_modal"
import {project} from "client/client_globals"

export const LayersPage = () => {
	const layers = project.prop("layers")
	return TwoColumnLayout({grow: 1,
		backgroundChildren: [],
		foregroundChildren: [
			ModelBoundNamedIdList({
				items: layers,
				itemName: "layer",
				makeNew: showLayerCreateModal,
				getSubstituteList: proj => proj.layers, // TODO: check particles for particle type layers
				modelHasId: (model, id) => model.layerId === id,
				setModelId: (model, layerId) => ({...model, layerId}),
				getName: layer => `${layer.name} (${layer.type})`,
				canDelete: async item => {
					const layersWithType = layers.get().filter(layer => layer.type === item.type)
					return layersWithType.length > 1
				}
			})
		]})
}
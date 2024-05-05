import {WBox} from "@nartallax/cardboard"
import {UUID} from "common/uuid"
import {LayerType} from "@nartallax/e8"
import {showNamedIdListModal} from "client/component/named_id_list/named_id_list_modal"
import {project} from "client/client_globals"

export const showLayerListModal = async(selectedLayerId: WBox<UUID>, type: LayerType) => {
	const layer = await showNamedIdListModal({
		items: project.prop("layers").map(layers => layers.filter(layer => layer.type === type)),
		itemName: "layer"
	})

	if(layer !== null){
		selectedLayerId.set(layer.id)
	}
}
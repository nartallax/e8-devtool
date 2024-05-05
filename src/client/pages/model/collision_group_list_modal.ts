import {WBox} from "@nartallax/cardboard"
import {UUID} from "common/uuid"
import {showNamedIdListModal} from "client/component/named_id_list/named_id_list_modal"
import {promanProject} from "client/proman_client_globals"

export const showCollisionGroupListModal = async(selectedGroupId: WBox<UUID>) => {
	const group = await showNamedIdListModal({
		items: promanProject.prop("collisionGroups").map(x => x), // to disable editing
		itemName: "collision group"
	})

	if(group !== null){
		selectedGroupId.set(group.id)
	}
}
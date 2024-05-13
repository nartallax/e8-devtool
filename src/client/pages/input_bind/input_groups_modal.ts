import {WBox} from "@nartallax/cardboard"
import {project} from "client/client_globals"
import {NamedId} from "data/project"
import {UUID} from "crypto"
import {getRandomUUID, zeroUUID} from "common/uuid"
import {showNamedIdListModal} from "client/component/named_id_list/named_id_list_modal"

interface Props {
	readonly selectedGroup: WBox<UUID | null>
}

const emptyGroupId = zeroUUID

export const showInputGroupsModal = async(props: Props): Promise<void> => {
	const groups = project.prop("inputGroups")
	const groupsWithEmptyItem = groups.map(
		groups => [{id: emptyGroupId, name: "<no group>"}, ...groups],
		groupsWithNull => groupsWithNull.filter(x => x.id !== emptyGroupId) as NamedId[]
	)

	const group = await showNamedIdListModal({
		items: groupsWithEmptyItem,
		itemName: "input group",
		canDelete: async x => x.id !== emptyGroupId,
		makeNew: async() => ({id: getRandomUUID(), name: "New group"}),
		beforeDelete: x => {
			const proj = project.get()
			let totalChanges = 0
			const bindSets = proj.inputBinds.map(bindSet => {
				let changes = 0
				const binds = bindSet.binds.map(bind => {
					if(bind.group === x.id){
						changes++
						return {...bind, group: null}
					} else {
						return bind
					}
				})
				totalChanges += changes
				return changes === 0 ? bindSet : {...bindSet, binds}
			})
			if(totalChanges > 0){
				project.set({
					...proj,
					inputBinds: bindSets
				})
			}
		}
	})

	if(group !== null){
		if(group.id === emptyGroupId){
			props.selectedGroup.set(null)
		} else {
			props.selectedGroup.set(group.id)
		}
	}
}
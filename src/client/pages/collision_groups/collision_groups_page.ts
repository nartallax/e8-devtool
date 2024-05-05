import {getRandomUUID} from "common/uuid"
import {Button} from "client/component/button/button"
import {askUserForString} from "client/component/modal/ask_user_for_string"
import {ModelBoundNamedIdList} from "client/component/named_id_list/model_bound_named_id_list"
import {TwoColumnLayout} from "client/component/two_column_layout/two_column_layout"
import {showCollisionPairsModal} from "client/pages/collision_groups/collision_pairs_modal/collision_pairs_modal"
import {promanProject} from "client/proman_client_globals"

export const CollisionGroupsPage = () => {
	return TwoColumnLayout({
		grow: 1,
		backgroundChildren: [],
		foregroundChildren: [ModelBoundNamedIdList({
			items: promanProject.prop("collisionGroups"),
			itemName: "collision group",
			getSubstituteList: proj => proj.collisionGroups,
			modelHasId: (model, id) => model.collisionGroupId === id,
			setModelId: (model, collisionGroupId) => ({...model, collisionGroupId}),
			makeNew: async() => {
				const name = await askUserForString({
					title: "Collision group name",
					placeholder: "Enter new collision group name"
				})
				return ({id: getRandomUUID(), name: name ?? "new collision group"})
			},
			additionalButtons: [Button({
				text: "Collisions",
				onClick: () => showCollisionPairsModal()
			})],
			onDelete: id => {
				const proj = promanProject.get()
				promanProject.set({
					...proj,
					collisionGroupPairs: proj.collisionGroupPairs.filter(([a, b]) => a !== id && b !== id)
				})
			},
			limit: 31
		})]
	})
}
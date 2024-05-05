import {WBox, calcBox, isArrayItemWBox} from "@nartallax/cardboard"
import {promanProject} from "client/proman_client_globals"
import {Button} from "client/component/button/button"
import {askUserForString} from "client/component/modal/ask_user_for_string"
import {Row} from "client/component/row_col/row_col"
import {TreeView} from "client/component/tree_view/tree_view"
import {TwoColumnLayout} from "client/component/two_column_layout/two_column_layout"
import {showInputBindModal} from "client/pages/input_bind/input_bind_modal"
import {PromanProjectInputBind, PromanNamedId} from "data/proman_project"
import {TreeBranch, TreeLeaf, isTreeBranch} from "common/tree"
import {chordToString} from "@nartallax/e8"
import {getRandomUUID} from "common/uuid"

export const InputBindPage = () => {
	const bindSets = promanProject.prop("inputBinds")
	const bindSetTree: WBox<TreeBranch<PromanProjectInputBind, PromanNamedId>[]> = bindSets.map(
		bindSets => bindSets.map(bindSet => ({
			value: {id: bindSet.id, name: bindSet.name},
			children: bindSet.binds.map(bind => ({
				value: bind
			}))
		})),
		trees => trees.map(bindSetBranch => ({
			id: bindSetBranch.value.id,
			name: bindSetBranch.value.name,
			binds: bindSetBranch.children.map(bindLeaf => bindLeaf.value)
		}))
	)

	const inputGroups = promanProject.prop("inputGroups")

	return TwoColumnLayout({
		grow: 1,
		foregroundChildren: [
			Row({justify: "start", gap: true, padding: "bottom"}, [
				Button({
					text: "Add bind set",
					onClick: async() => {
						const name = await askUserForString({title: "New bind set name", placeholder: "Enter name of a new bind set"})
						if(!name){
							return
						}
						bindSets.appendElement({id: getRandomUUID(), binds: [], name})
					}
				})
			]),
			TreeView({
				data: bindSetTree,
				getId: tree => tree.value.id,
				getRowLabel: treeBox => {
					if(isTreeBranch(treeBox.get())){
						return treeBox.prop("value").prop("name")
					}
					return calcBox([treeBox, inputGroups], ({value}, inputGroups) => {
						const bind = value as PromanProjectInputBind
						const chords = bind.defaultChords

						let chordsStr: string
						if(chords.length === 0){
							chordsStr = "no default"
						} else {
							const chord = chords[0]!
							chordsStr = chordToString(chord)
							if(chords.length > 1){
								chordsStr += ` and ${chords.length - 1} more`
							}
						}

						let groupStr = ""
						if(bind.group !== null){
							const group = inputGroups.find(group => group.id === bind.group)
							groupStr = (group?.name ?? "<broken group>") + "; "
						}

						return `${bind.name} (${groupStr}${chordsStr})`
					})
				},
				allowReorder: "within-parent",
				onDelete: row => {
					if(isArrayItemWBox(row)){
						row.deleteArrayElement()
					}
				},
				onAddToBranch: async row => {
					const bind: PromanProjectInputBind = {
						name: "unnamed bind",
						defaultChords: [],
						id: getRandomUUID(),
						group: null,
						isHold: false
					}
					const children = row.prop("children")
					const context = children.getArrayContext(x => x.value.id)
					children.appendElement({value: bind})
					const bindBox = context.getBoxForKey(bind.id).prop("value") as WBox<PromanProjectInputBind>
					await showInputBindModal({bind: bindBox})
				},
				onEdit: async row => {
					const tree = row.get()
					if(isTreeBranch(tree)){
						const newName = await askUserForString({
							title: "Rename input bind set " + tree.value.name,
							initialValue: tree.value.name,
							placeholder: "Enter new name for input bind set " + tree.value.name
						})
						if(!newName){
							return
						}
						row.prop("value").prop("name").set(newName)
					} else {
						await showInputBindModal({
							bind: (row as WBox<TreeLeaf<PromanProjectInputBind>>).prop("value")
						})
					}
				}
			})
		],
		backgroundChildren: []
	})
}
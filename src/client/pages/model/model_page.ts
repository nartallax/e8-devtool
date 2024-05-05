import {RBox, WBox, box, isArrayItemWBox} from "@nartallax/cardboard"
import {project, makeEmptyProjectModel} from "client/client_globals"
import {Button} from "client/component/button/button"
import {askUserForString} from "client/component/modal/ask_user_for_string"
import {Row} from "client/component/row_col/row_col"
import {TreeView} from "client/component/tree_view/tree_view"
import {TwoColumnLayout} from "client/component/two_column_layout/two_column_layout"
import {ModelDisplay} from "client/pages/model/model_display/model_display"
import {showModelModal} from "client/pages/model/model_modal"
import {NamedId} from "data/project"
import {isTreeBranch, isTreeLeaf} from "common/tree"
import {UUID} from "crypto"
import {getRandomUUID} from "common/uuid"

export const ModelPage = () => {
	const modelTree = project.prop("modelTree")
	const models = project.prop("models")
	const modelContext = models.getArrayContext(x => x.id)
	const selectedModelId = box<UUID | null>(null)

	return TwoColumnLayout({
		grow: 1,
		foregroundChildren: [
			Row({justify: "start", gap: true, padding: "bottom"}, [
				Button({
					text: "Add model",
					onClick: () => {
						const model = makeEmptyProjectModel()
						models.appendElement(model)
						modelTree.prependElement({value: model.id})
						const modelBox = modelContext.getBoxForKey(model.id)
						selectedModelId.set(model.id)
						return showModelModal(modelBox)
					}
				}),
				Button({
					text: "Add folder",
					onClick: async() => {
						const name = await askUserForString({title: "New folder name", placeholder: "Enter name of a new folder"})
						if(!name){
							return
						}
						modelTree.prependElement({
							value: {name, id: getRandomUUID()},
							children: []
						})
					}
				})
			]),
			TreeView({
				data: modelTree,
				getId: tree => isTreeBranch(tree) ? tree.value.id : tree.value,
				getRowLabel: treeBox => {
					const tree = treeBox.get()
					return isTreeBranch(tree)
						? (treeBox.prop("value") as RBox<NamedId>).prop("name")
						: modelContext.getBoxForKey(tree.value).prop("name")
				},
				allowReorder: true,
				onDelete: row => {
					const tree = row.get()
					if(isTreeLeaf(tree)){
						const id = tree.value
						modelContext.getBoxForKey(id).deleteArrayElement()
					}
					if(isArrayItemWBox(row)){
						row.deleteArrayElement()
					}
				},
				selectedLeaf: selectedModelId,
				onEdit: async row => {
					const tree = row.get()
					if(isTreeBranch(tree)){
						const newName = await askUserForString({
							title: "Rename model folder " + tree.value.name,
							initialValue: tree.value.name,
							placeholder: "Enter new name for model folder " + tree.value.name
						})
						if(!newName){
							return
						}
						(row.prop("value") as WBox<NamedId>).prop("name").set(newName)
					} else {
						await showModelModal(modelContext.getBoxForKey(tree.value))
					}
				}
			})
		],
		backgroundChildren: [ModelDisplay({selectedModelId, modelContext})]
	})
}
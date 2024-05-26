import {WBox, calcBox} from "@nartallax/cardboard"
import {project, textureFiles} from "client/client_globals"
import {BoolInput} from "client/component/bool_input/bool_input"
import {Button} from "client/component/button/button"
import {showModal} from "client/component/modal/modal"
import {NumberInput} from "client/component/number_input/number_input"
import {Row} from "client/component/row_col/row_col"
import {TextInput} from "client/component/text_input/text_input"
import {Tooltip} from "client/component/tooltip/tooltip"
import {TreeView} from "client/component/tree_view/tree_view"
import {ProjectModel} from "data/project"
import {getTreeLeaves} from "common/tree"
import {showLayerListModal} from "client/pages/model/layer_list_modal"
import {showCollisionGroupListModal} from "client/pages/model/collision_group_list_modal"

export const showModelModal = async(model: WBox<ProjectModel>): Promise<void> => {
	const name = model.prop("name")

	const layerId = model.prop("layerId")
	const layers = project.prop("layers")
	const selectedLayer = calcBox([layers, layerId], (layers, layerId) => layers.find(x => x.id === layerId))

	const collGroupId = model.prop("collisionGroupId")
	const collGroups = project.prop("collisionGroups")
	const selectedCollGroup = calcBox([collGroups, collGroupId], (collGroups, collGroupId) => collGroups.find(x => x.id === collGroupId))

	// they shouldn't change anyway
	const textureIdAndFullPath = textureFiles.get().flatMap(tree => [...getTreeLeaves(tree)].map(([,leaf]) => [leaf.id, leaf.fullPath] as const))
	const textureIdToPathMap = new Map(textureIdAndFullPath)
	const texturePathToIdMap = new Map(textureIdAndFullPath.map(([a, b]) => [b, a]))
	const selectedTextureId = model.prop("texturePath").map(
		texturePath => texturePathToIdMap.get(texturePath)!,
		textureId => textureIdToPathMap.get(textureId)!
	)

	const size = model.prop("size")
	const width = size.prop("x")
	const height = size.prop("y")

	await showModal({
		title: name.map(name => "Model: " + name),
		height: "75vh",
		width: "55vw",
		align: "stretch"
	}, [
		Row({justify: "start", gap: true, border: "bottom", padding: "bottom"}, [
			Button({
				text: selectedLayer.map(layer => "Layer: " + (!layer ? "<broken, please select another>" : layer.name)),
				onClick: () => showLayerListModal(layerId, "model")
			}),
			Button({
				text: selectedCollGroup.map(group => "Collision group: " + (!group ? "<broken, please select another>" : group.name)),
				onClick: () => showCollisionGroupListModal(collGroupId)
			})
		]),
		Row({justify: "start", gap: true, border: "bottom", padding: "vertical"}, [
			"Size: ",
			Tooltip({text: "Width x Height, in inworld units"}),
			NumberInput({value: width, width: "5rem"}),
			"x",
			NumberInput({value: height, width: "5rem"}),
			"Is static: ",
			BoolInput({value: model.prop("isStatic")})
		]),
		Row({justify: "start", gap: true, padding: "vertical"}, [
			"Name: ",
			TextInput({value: model.prop("name")})
		]),
		TreeView({
			data: textureFiles,
			getId: tree => tree.value.id,
			getRowLabel: tree => tree.prop("value").prop("name"),
			selectedLeaf: selectedTextureId
		})
	]).waitClose()
}
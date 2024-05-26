import {box} from "@nartallax/cardboard"
import {getRandomUUID} from "common/uuid"
import {LayerType} from "@nartallax/e8"
import {askUserForString} from "client/component/modal/ask_user_for_string"
import {SelectInput} from "client/component/select_input/select_input"
import {ProjectLayerDefinition} from "data/project"

const layerTypeOptions = (["model", "particle"] as const).map(name => ({name, value: name}))

export const showLayerCreateModal = async(): Promise<ProjectLayerDefinition> => {
	const layerBox = box<ProjectLayerDefinition>({
		id: getRandomUUID(),
		name: "New layer",
		type: "model"
	})

	await askUserForString({
		title: "New layer",
		value: layerBox.prop("name")
	}, [
		SelectInput<LayerType>({items: layerTypeOptions, value: layerBox.prop("type")})
	])

	return layerBox.get()
}
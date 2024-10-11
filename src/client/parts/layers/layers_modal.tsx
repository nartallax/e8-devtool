import {LayerType} from "@nartallax/e8"
import {Form} from "client/components/form/form"
import {Modal} from "client/components/modal/modal"
import {Col} from "client/components/row_col/row_col"
import {StringForestView} from "client/components/tree_view/string_forest_view"
import {layerProvider} from "client/parts/data_providers/data_providers"
import {ModalSubmitCancelButtons} from "client/parts/modal_buttons/modal_submit_cancel_buttons"
import {getRandomUUID} from "common/uuid"
import {useState} from "react"

type Props = {
	value: string | null
	onClose: (value?: string | null) => void
	layerType: LayerType
}

export const LayersModal = ({
	value: initialValue, onClose, layerType
}: Props) => {
	const [path, setPath] = useState(initialValue)

	const forestProps = layerProvider.useEditableForest({
		createItem: () => ({id: getRandomUUID(), type: layerType})
	})

	const layerMap = layerProvider.useAsMap()

	const {get: getLayerByPath} = layerProvider.useFetchers()

	const ifTypeIsRight = async(path: string, callback: () => void) => {
		// TODO: right now this bugs out, because getLayerByPath uses old version of project
		// but after we are converted to API, this should stop happening naturally
		// but I'll need to check if that works this way
		const layer = await getLayerByPath(path)
		if(layer.type === layerType){
			callback()
		}
	}

	if(!forestProps){
		return null
	}

	return (
		<Modal
			header="Layers"
			contentWidth={["300px", "50vw", "600px"]}
			contentHeight={["300px", "50vh", "800px"]}
			onClose={onClose}>
			<Form onSubmit={() => onClose(path)}>
				<Col gap stretch grow>
					<StringForestView
						{...forestProps}
						itemName="layer"
						selectedPath={path}
						setSelectedPath={setPath}
						onItemClick={path => ifTypeIsRight(path, () => setPath(path))}
						onItemDoubleclick={path => ifTypeIsRight(path, () => onClose(path))}
						getItemSublabel={path => !layerMap ? "" : `(${layerMap.get(path)?.type ?? "???"})`}
					/>
					<ModalSubmitCancelButtons onCancel={onClose}/>
				</Col>
			</Form>
		</Modal>
	)
}
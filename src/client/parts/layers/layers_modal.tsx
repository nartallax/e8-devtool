import {LayerType} from "@nartallax/e8"
import {Form} from "client/components/form/form"
import {Modal} from "client/components/modal/modal"
import {Col} from "client/components/row_col/row_col"
import {StringForestView} from "client/components/tree_view/string_forest_view"
import {UnsavedChanges} from "client/components/unsaved_changes_context/unsaved_changes_context"
import {layerProvider, modelProvider, particleProvider} from "client/parts/data_providers/data_providers"
import {ModalSubmitCancelButtons} from "client/parts/modal_buttons/modal_submit_cancel_buttons"
import {getRandomUUID} from "common/uuid"
import {useState} from "react"

type Props = {
	value: string
	onClose: (value?: string) => void
	layerType: LayerType
}

export const LayersModal = ({
	value: initialValue, onClose: rawOnClose, layerType
}: Props) => {
	const [path, setPath] = useState(initialValue)

	const {getReferrers: getModelReferrers} = modelProvider.useFetchers()
	const {getReferrers: getParticleReferrers} = particleProvider.useFetchers()

	const {forestProps, changesProps, onClose} = layerProvider.useEditableForest({
		createItem: () => ({id: getRandomUUID(), type: layerType}),
		getReferrers: layer => [
			getModelReferrers("layerId", layer.id),
			getParticleReferrers("layerId", layer.id)
		],
		onClose: rawOnClose
	})

	const {getByPath: getLayerByPath} = layerProvider.useFetchers()

	const ifTypeIsRight = async(path: string, callback: () => void) => {
		await changesProps.save()
		// TODO: right now this bugs out, because getLayerByPath uses old version of project
		// but after we are converted to API, this should stop happening naturally
		// but I'll need to check if that works this way
		const layer = await getLayerByPath(path)
		if(layer.type === layerType){
			callback()
		}
	}

	return (
		<UnsavedChanges {...changesProps}>
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
							onItemClick={path => ifTypeIsRight(path, () => setPath(path))}
							onItemDoubleclick={path => ifTypeIsRight(path, () => onClose(path))}
							// TODO: bring this back
							// getItemSublabel={layer => `(${layer.type})`}
						/>
						<ModalSubmitCancelButtons onCancel={onClose}/>
					</Col>
				</Form>
			</Modal>
		</UnsavedChanges>
	)
}
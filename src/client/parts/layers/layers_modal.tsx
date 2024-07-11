import {LayerType} from "@nartallax/e8"
import {Form} from "client/components/form/form"
import {Modal} from "client/components/modal/modal"
import {Col} from "client/components/row_col/row_col"
import {StringForestView} from "client/components/tree_view/string_forest_view"
import {useLayerResolver, useModelsWithLayerByPath, useParticlesWithLayerByPath, withLayersForest} from "client/parts/data_providers/data_providers"
import {ModalSubmitCancelButtons} from "client/parts/modal_buttons/modal_submit_cancel_buttons"
import {useReferrersError} from "client/parts/use_referrers_error"
import {Tree, TreePath} from "common/tree"
import {getRandomUUID} from "common/uuid"
import {mergePath} from "data/project_utils"
import {useState} from "react"

type Props = {
	value: string
	onClose: (value?: string) => void
	layerType: LayerType
}

export const LayersModal = withLayersForest<Props>(
	{createItem: ({layerType}) => ({id: getRandomUUID(), type: layerType})},
	({
		value: initialValue, onClose, layerType, deleteNode: onNodeDeleted, ...forestProps
	}) => {
		const [path, setPath] = useState(initialValue)

		const tryShowRefsError = useReferrersError("layer", [
			useModelsWithLayerByPath(path),
			useParticlesWithLayerByPath(path)
		])

		const onDelete = async(node: Tree<string, string>, path: TreePath) => {
			await tryShowRefsError()
			await onNodeDeleted(node, path)
		}

		const getLayer = useLayerResolver()

		const ifTypeIsRight = async(path: string, callback: () => void) => {
			const layer = await getLayer(path)
			if(layer.type === layerType){
				callback()
			}
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
							makePath={mergePath}
							itemName="layer"
							deleteNode={onDelete}
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
		)
	})
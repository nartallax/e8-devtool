import {LayerType} from "@nartallax/e8"
import {Form} from "client/components/form/form"
import {useAlert} from "client/components/modal/alert_modal"
import {Modal} from "client/components/modal/modal"
import {Col} from "client/components/row_col/row_col"
import {MappedForestView} from "client/parts/mapped_forest_view/mapped_forest_view"
import {ModalSubmitCancelButtons} from "client/parts/modal_buttons/modal_submit_cancel_buttons"
import {useProject} from "client/parts/project_context"
import {AbortError} from "client/ui_utils/abort_error"
import {UUID, getRandomUUID} from "common/uuid"
import {Project, ProjectLayerDefinition} from "data/project"
import {namesOfModelsWhich} from "data/project_utils"
import {useState} from "react"

type Props = {
	value: UUID
	onClose: (value?: UUID) => void
	layerType: LayerType
}

export const LayersModal = ({value: initialValue, onClose, layerType}: Props) => {
	const [project, setProject] = useProject()
	const [layer, setLayer] = useState(() =>
		Object.values(project.layers).find(group => group.id === initialValue) ?? null
	)
	const {showAlert} = useAlert()

	const onDelete = (layer: ProjectLayerDefinition) => {
		// TODO: check particles for particle type layers
		const msg = getDeletionConflictMessage(project, layer.id)
		if(msg !== null){
			void showAlert({
				header: "This layer is in use",
				body: msg
			})

			throw new AbortError("Has conflicts")
		}
	}

	return (
		<Modal
			header="Layers"
			contentWidth={["300px", "50vw", "600px"]}
			contentHeight={["300px", "50vh", "800px"]}
			onClose={onClose}>
			<Form onSubmit={() => onClose(layer?.id)}>
				<Col gap stretch grow>
					<MappedForestView
						itemName="layer"
						createItem={() => ({id: getRandomUUID(), type: layerType})}
						forest={project.layerTree}
						onForestChange={layerTree => setProject(project => ({...project, layerTree}))}
						mapObject={project.layers}
						onMapChange={layers => setProject(project => ({...project, layers}))}
						selectedItem={layer}
						onItemClick={item => item.type === layerType && setLayer(item)}
						onItemDoubleclick={item => item.type === layerType && onClose(item.id)}
						getItemSublabel={layer => `(${layer.type})`}
						beforeItemDelete={onDelete}
					/>
					<ModalSubmitCancelButtons onCancel={onClose}/>
				</Col>
			</Form>
		</Modal>
	)
}

const getDeletionConflictMessage = (project: Project, layerId: string): string | null => {
	const allNames = namesOfModelsWhich(project, model => model.layerId === layerId)
	if(allNames.length === 0){
		return null
	}
	const firstFewNames = allNames.slice(0, 10)
	if(firstFewNames.length < allNames.length){
		firstFewNames.push(`...and ${allNames.length - firstFewNames.length} more.`)
	}
	const namesStr = firstFewNames.join("\n\t")

	return `This layer is already used in some models: \n\t${namesStr}\nYou should remove models from this layer before deleting it.`
}
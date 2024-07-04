import {LayerType} from "@nartallax/e8"
import {Button} from "client/components/button/button"
import {Form} from "client/components/form/form"
import {useAlert} from "client/components/modal/alert_modal"
import {Modal} from "client/components/modal/modal"
import {Col} from "client/components/row_col/row_col"
import {MappedNamedIdTreeView} from "client/components/tree_view/mapped_named_id_tree_view"
import {ModalSubmitCancelButtons} from "client/parts/modal_buttons/modal_submit_cancel_buttons"
import {useProject} from "client/parts/project_context"
import {AbortError} from "client/ui_utils/abort_error"
import {UUID, getRandomUUID} from "common/uuid"
import {ProjectLayerDefinition, ProjectModel} from "data/project"
import {Icon} from "generated/icons"
import {useState} from "react"

type Props = {
	value: UUID
	onClose: (value?: UUID) => void
	layerType: LayerType
}

export const LayersModal = ({value: initialValue, onClose, layerType}: Props) => {
	const [project, setProject] = useProject()
	const [value, setValue] = useState(initialValue)
	const {showAlert} = useAlert()

	const onDelete = (layer: ProjectLayerDefinition) => {
		// TODO: check particles for particle type layers
		const models = project.models.filter(model => model.layerId === layer.id)
		if(models.length > 0){
			void showAlert({
				header: "This layer is in use",
				body: getDeletionConflictMessage(models)
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
			<Form onSubmit={() => onClose(value)}>
				<Col gap stretch grow>
					<MappedNamedIdTreeView
						selectedValue={value}
						onLeafClick={leaf => leaf.type === layerType && setValue(leaf.id)}
						onLeafDoubleclick={leaf => leaf.type === layerType && onClose(leaf.id)}
						values={project.layers}
						toTree={layer => ({value: layer})}
						fromTree={node => node.value}
						buttons={controls => <Button text="Add layer" icon={Icon.filePlus} onClick={() => controls.addRenameLeaf()}/>}
						onLeafCreated={name => ({id: getRandomUUID(), name, type: layerType})}
						onChange={layers => setProject(project => ({...project, layers}))}
						getLeafSublabel={(layer: ProjectLayerDefinition) => `(${layer.type})`}
						onLeafDelete={onDelete}
						canBeChildOf={(_, parent) => !parent}
					/>
					<ModalSubmitCancelButtons onCancel={onClose}/>
				</Col>
			</Form>
		</Modal>
	)
}

const getDeletionConflictMessage = (models: ProjectModel[]): string => {
	const firstFewNames = models.slice(0, 10).map(x => x.name)
	if(firstFewNames.length < models.length){
		firstFewNames.push(`...and ${models.length - firstFewNames.length} more.`)
	}
	const namesStr = firstFewNames.join("\n\t")

	return `This layer is already used in some models: \n\t${namesStr}\nYou should remove models from this layer before deleting it.`
}
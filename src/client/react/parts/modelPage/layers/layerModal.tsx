import {LayerType} from "@nartallax/e8"
import {Button} from "client/react/components/button/button"
import {Form} from "client/react/components/form/form"
import {AlertModal} from "client/react/components/modal/alertModal"
import {Modal} from "client/react/components/modal/modal"
import {Col} from "client/react/components/rowCol/rowCol"
import {MappedNamedIdTreeView} from "client/react/components/treeView/mappedNamedIdTreeView"
import {ModalSubmitCancelButtons} from "client/react/parts/modalButtons/modalSubmitCancelButtons"
import {useProject} from "client/react/parts/projectContext"
import {AbortError} from "client/react/uiUtils/abortError"
import {UUID} from "common/uuid"
import {ProjectLayerDefinition, ProjectModel} from "data/project"
import {Icon} from "generated/icons"
import {useState} from "react"

type Props = {
	readonly value: UUID
	readonly onClose: (value?: UUID) => void
	readonly layerType: LayerType
}

export const LayerModal = ({value: initialValue, onClose, layerType}: Props) => {
	const [project, setProject] = useProject()
	const [value, setValue] = useState(initialValue)

	const [deletionConflictModels, setDeletionConflictModels] = useState<ProjectModel[]>([])
	const onDelete = (layer: ProjectLayerDefinition) => {
		// TODO: check particles for particle type layers
		const models = project.models.filter(model => model.layerId === layer.id)
		if(models.length > 0){
			setDeletionConflictModels(models)
			throw new AbortError("Has conflicts")
		}
	}

	const getDeletionConflictMessage = (models: ProjectModel[]): string => {
		const firstFewNames = models.slice(0, 10).map(x => x.name)
		if(firstFewNames.length < models.length){
			firstFewNames.push(`...and ${models.length - firstFewNames.length} more.`)
		}
		const namesStr = firstFewNames.join("\n\t")

		return `This layer is already used in some models: \n\t${namesStr}\nYou should remove models from this layer before deleting it.`
	}

	return (
		<Modal
			header="Collision groups"
			contentWidth={["300px", "50vw", "600px"]}
			contentHeight={["300px", "50vh", "800px"]}
			onClose={onClose}>
			<Form onSubmit={() => onClose(value)}>
				<Col gap stretch grow>
					{deletionConflictModels.length > 0
					&& <AlertModal
						header="This layer is in use"
						body={getDeletionConflictMessage(deletionConflictModels)}
						onClose={() => setDeletionConflictModels([])}
					   />}
					<MappedNamedIdTreeView
						selectedValue={value}
						onLeafClick={leaf => leaf.type === layerType && setValue(leaf.id)}
						onLeafDoubleclick={leaf => leaf.type === layerType && onClose(leaf.id)}
						values={project.layers}
						toTree={layer => ({value: layer})}
						fromTree={node => node.value}
						buttons={controls => <Button text="Add layer" icon={Icon.filePlus} onClick={() => controls.addRenameLeaf({type: layerType})}/>}
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
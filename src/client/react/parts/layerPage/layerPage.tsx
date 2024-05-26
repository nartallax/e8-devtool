import {Button} from "client/react/components/button/button"
import {AlertModal} from "client/react/components/modal/alertModal"
import {MappedNamedIdTreeView} from "client/react/components/treeView/mappedNamedIdTreeView"
import {NewLayerModal} from "client/react/parts/layerPage/newLayerModal"
import {CentralColumn} from "client/react/parts/layouts/centralColumn"
import {useProject} from "client/react/parts/projectContext"
import {AbortError} from "client/react/uiUtils/abortError"
import {ProjectLayerDefinition, ProjectModel} from "data/project"
import {Icon} from "generated/icons"
import {useState} from "react"

export const LayerPage = () => {
	const [project, setProject] = useProject()

	const [isNewLayerModalOpen, setNewLayerModalOpen] = useState(false)
	const onNewLayerModalClose = (layer?: ProjectLayerDefinition) => {
		setNewLayerModalOpen(false)
		if(layer){
			setProject(project => ({
				...project,
				layers: [layer, ...project.layers]
			}))
		}
	}

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
		<CentralColumn>
			{!!isNewLayerModalOpen && <NewLayerModal onClose={onNewLayerModalClose}/>}
			{deletionConflictModels.length > 0 && <AlertModal
				header="This layer is in use"
				body={getDeletionConflictMessage(deletionConflictModels)}
				onClose={() => setDeletionConflictModels([])}/>}
			<MappedNamedIdTreeView
				values={project.layers}
				toTree={layer => ({value: layer})}
				fromTree={node => node.value}
				buttons={() => <Button text="Add layer" icon={Icon.filePlus} onClick={() => setNewLayerModalOpen(true)}/>}
				onChange={layers => setProject(project => ({...project, layers}))}
				getLeafSublabel={(layer: ProjectLayerDefinition) => `(${layer.type})`}
				onLeafDelete={onDelete}
				canBeChildOf={(_, parent) => !parent}/>
		</CentralColumn>
	)
}
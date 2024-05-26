import {Button} from "client/react/components/button/button"
import {AlertModal} from "client/react/components/modal/alertModal"
import {Col} from "client/react/components/rowCol/rowCol"
import {MappedNamedIdTreeView} from "client/react/components/treeView/mappedNamedIdTreeView"
import {NewLayerModal} from "client/react/parts/layerPage/newLayerModal"
import {useProject} from "client/react/parts/projectContext"
import {AbortError} from "client/react/uiUtils/abortError"
import {LayerDefinition, ProjectEntity} from "data/project"
import {Icon} from "generated/icons"
import {useState} from "react"

export const LayerPage = () => {
	const [project, setProject] = useProject()

	const [isNewLayerModalOpen, setNewLayerModalOpen] = useState(false)
	const onNewLayerModalClose = (layer?: LayerDefinition) => {
		setNewLayerModalOpen(false)
		if(layer){
			setProject(project => ({
				...project,
				layers: [layer, ...project.layers]
			}))
		}
	}

	const [deletionConflictModels, setDeletionConflictModels] = useState<ProjectEntity[]>([])
	const onDelete = (layer: LayerDefinition) => {
		const models = project.models.filter(model => model.layerId === layer.id)
		if(models.length > 0){
			setDeletionConflictModels(models)
			throw new AbortError("Has conflicts")
		}
	}

	const getDeletionConflictMessage = (models: ProjectEntity[]): string => {
		const firstFewNames = models.slice(0, 10).map(x => x.name)
		if(firstFewNames.length < models.length){
			firstFewNames.push(`...and ${models.length - firstFewNames.length} more.`)
		}
		const namesStr = firstFewNames.join("\n\t")

		return `This layer is already used in some models: \n\t${namesStr}\nYou should remove models from this layer before deleting it.`
	}

	return (
		<Col
			width="100%"
			padding
			align="center"
			grow={1}>
			<Col
				width={["400px", "50vw", "800px"]}
				grow={1}
				align="stretch"
				gap>
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
					getLeafSublabel={(layer: LayerDefinition) => `(${layer.type})`}
					onLeafDelete={onDelete}
					canBeChildOf={(_, parent) => !parent}/>
			</Col>
		</Col>
	)
}
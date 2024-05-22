import {Button} from "client/react/components/button/button"
import {AlertModal} from "client/react/components/modal/alertModal"
import {Col, Row} from "client/react/components/rowCol/rowCol"
import {TreeView} from "client/react/components/treeView/treeView"
import {NewLayerModal, getLayerNameValidators} from "client/react/parts/layerPage/newLayerModal"
import {useProject} from "client/react/parts/projectContext"
import {TreePath, moveArrayByPath} from "common/tree"
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
	const tryDeleteLayer = (path: TreePath) => {
		const index = path[0]
		if(index === undefined || path.length > 1){
			throw new Error("wat")
		}

		const layer = project.layers[index]!
		const models = project.models.filter(model => model.layerId === layer.id)
		if(models.length > 0){
			setDeletionConflictModels(models)
		} else {
			setProject(project => {
				const layers = project.layers.filter(({id}) => id !== layer.id)
				return {...project, layers}
			})
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
				<Row justify="start" gap>
					{!!isNewLayerModalOpen && <NewLayerModal onClose={onNewLayerModalClose}/>}
					{deletionConflictModels.length > 0 && <AlertModal
						header="This layer is in use"
						body={getDeletionConflictMessage(deletionConflictModels)}
						onClose={() => setDeletionConflictModels([])}/>}
					<Button text="Add layer" icon={Icon.filePlus} onClick={() => setNewLayerModalOpen(true)}/>
				</Row>
				<TreeView
					tree={project.layers.map(layer => ({value: layer}))}
					getLeafKey={({id}) => id}
					getLeafLabel={({name}) => name}
					getLeafSublabel={({type}) => `(${type})`}
					leafLabelValidators={layer => getLayerNameValidators(project, layer.id)}
					onDrag={(from, to) => setProject(project => {
						const layers = moveArrayByPath(project.layers, from, to)
						return {...project, layers}
					})}
					onLeafDelete={tryDeleteLayer}
					onLeafLabelEdit={(path, name) => {
						if(path.length !== 1){
							throw new Error("how.")
						}
						setProject(project => {
							const layers = [...project.layers]
							layers[path[0]!] = {...layers[path[0]!]!, name}
							return {...project, layers}
						})
					}}/>
			</Col>
		</Col>
	)
}
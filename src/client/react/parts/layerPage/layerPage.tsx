import {Button} from "client/react/components/button/button"
import {Col, Row} from "client/react/components/rowCol/rowCol"
import {TreeView} from "client/react/components/treeView/treeView"
import {NewLayerModal} from "client/react/parts/layerPage/newLayerModal"
import {useProject} from "client/react/parts/projectContext"
import {LayerDefinition} from "data/project"
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
					<Button text="Add layer" icon={Icon.filePlus} onClick={() => setNewLayerModalOpen(true)}/>
				</Row>
				<TreeView
					tree={project.layers.map(layer => ({value: layer}))}
					getLeafKey={({id}) => id}
					getLeafLabel={({name, type}) => `${name} (${type})`}/>
			</Col>
		</Col>
	)
}
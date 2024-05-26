import {Button} from "client/react/components/button/button"
import {useRoutingContext} from "client/react/components/router/routingContext"
import {Col} from "client/react/components/rowCol/rowCol"
import {MappedNamedIdTreeView} from "client/react/components/treeView/mappedNamedIdTreeView"
import {useProject} from "client/react/parts/projectContext"
import {appendUrlPath, pushHistory} from "client/react/uiUtils/urls"
import {mapTreeLeaves} from "common/tree"
import {Icon} from "generated/icons"


export const ModelSelector = () => {
	const [project, setProject] = useProject()
	const modelMap = new Map(project.models.map(model => [model.id, model]))
	const {matchedUrl} = useRoutingContext()

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
				<MappedNamedIdTreeView
					values={project.modelTree}
					toTree={node => mapTreeLeaves(node, id => ({id, name: modelMap.get(id)!.name}))}
					// TODO: think about renaming. name is lost here
					fromTree={node => mapTreeLeaves(node, namedId => namedId.id)}
					onChange={modelTree => setProject(project => ({...project, modelTree}))}
					canBeChildOf={() => true}
					buttons={controls => (<>
						<Button text="Add directory" icon={Icon.folderPlus} onClick={() => controls.addRenameBranch({})}/>
						<Button text="Add model" icon={Icon.filePlus}/>
					</>)}
					onLeafDoubleclick={namedId => pushHistory(appendUrlPath(matchedUrl, `./${namedId.id}`))}
					onLeafRename={(namedId, name) => setProject(project => {
						const models = project.models.map(model => {
							if(model.id !== namedId.id){
								return model
							}
							return {...model, name}
						})
						return {...project, models}
					})}/>
			</Col>
		</Col>
	)
}
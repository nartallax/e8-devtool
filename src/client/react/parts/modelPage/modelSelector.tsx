import {Button} from "client/react/components/button/button"
import {useRoutingContext} from "client/react/components/router/routingContext"
import {MappedNamedIdTreeView} from "client/react/components/treeView/mappedNamedIdTreeView"
import {CentralColumn} from "client/react/parts/layouts/centralColumn"
import {useProject} from "client/react/parts/projectContext"
import {appendUrlPath, pushHistory} from "client/react/uiUtils/urls"
import {mapTreeLeaves} from "common/tree"
import {Icon} from "generated/icons"


export const ModelSelector = () => {
	const [project, setProject] = useProject()
	const modelMap = new Map(project.models.map(model => [model.id, model]))
	const {matchedUrl} = useRoutingContext()

	return (
		<CentralColumn>
			<MappedNamedIdTreeView
				values={project.modelTree}
				toTree={node => mapTreeLeaves(node, id => ({id, name: modelMap.get(id)!.name}))}
				fromTree={node => mapTreeLeaves(node, namedId => namedId.id)}
				onChange={modelTree => setProject(project => ({...project, modelTree}))}
				canBeChildOf={() => true}
				buttons={controls => (
					<>
						<Button text="Add directory" icon={Icon.folderPlus} onClick={() => controls.addRenameBranch({})}/>
						<Button text="Add model" icon={Icon.filePlus}/>
					</>
				)}
				onLeafDoubleclick={namedId => pushHistory(appendUrlPath(matchedUrl, `./${namedId.id}`))}
				onLeafRename={(namedId, name) => setProject(project => {
					const models = project.models.map(model => {
						if(model.id !== namedId.id){
							return model
						}
						return {...model, name}
					})
					return {...project, models}
				})}
			/>
		</CentralColumn>
	)
}
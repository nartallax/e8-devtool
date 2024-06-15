import {Button} from "client/components/button/button"
import {useRoutingContext} from "client/components/router/routing_context"
import {MappedNamedIdTreeView} from "client/components/tree_view/mapped_named_id_tree_view"
import {CentralColumn} from "client/parts/layouts/central_column"
import {useProject} from "client/parts/project_context"
import {appendUrlPath, pushHistory} from "client/ui_utils/urls"
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
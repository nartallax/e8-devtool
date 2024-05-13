import {Router} from "client/react/components/router/router"
import {useRoutingContext} from "client/react/components/router/routingContext"
import {Col} from "client/react/components/rowCol/rowCol"
import {TreeView} from "client/react/components/treeView/treeView"
import {useProject} from "client/react/parts/projectContext"
import {appendUrlPath, pushHistory} from "client/react/uiUtils/urls"

export const ModelsPage = () => {
	return (
		<Router routes={[
			["/:modelId", ({modelId}) => {
				console.log(modelId)
				return modelId
			}],
			["/", () => <ModelSelector/>]
		]}/>
	)
}

const ModelSelector = () => {
	const [project] = useProject()
	const modelMap = new Map(project.models.map(model => [model.id, model]))
	const modelTree = project.modelTree
	const {matchedUrl} = useRoutingContext()

	return (
		<Col
			width="100%"
			padding
			align="center"
			grow={1}>
			<Col width={["400px", "50vw", "800px"]} grow={1} align="stretch">
				<TreeView
					tree={modelTree}
					onLeafDoubleclick={id => pushHistory(appendUrlPath(matchedUrl, `./${id}`))}
					getBranchKey={x => x.id}
					getLeafKey={x => x}
					getBranchLabel={x => x.name}
					getLeafLabel={x => modelMap.get(x)?.name ?? "<???>"}/>
			</Col>
		</Col>
	)
}
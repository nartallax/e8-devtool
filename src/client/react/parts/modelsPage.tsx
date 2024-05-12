import {TreeView} from "client/react/components/treeView/treeView"
import {useProject} from "client/react/parts/projectContext"

export const ModelsPage = () => {

	const [project] = useProject()
	const modelMap = new Map(project.models.map(model => [model.id, model]))
	const modelTree = project.modelTree

	return (
		<TreeView
			tree={modelTree}
			getBranchKey={x => x.id}
			getLeafKey={x => x}
			getBranchLabel={x => x.name}
			getLeafLabel={x => modelMap.get(x)?.name ?? "<???>"}/>
	)

}
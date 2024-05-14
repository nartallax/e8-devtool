import {Button} from "client/react/components/button/button"
import {useRoutingContext} from "client/react/components/router/routingContext"
import {Col, Row} from "client/react/components/rowCol/rowCol"
import {TreeControls, TreeView} from "client/react/components/treeView/treeView"
import {useProject} from "client/react/parts/projectContext"
import {appendUrlPath, pushHistory} from "client/react/uiUtils/urls"
import {Tree, TreePath, deleteTreeByPath, getBranchByPath, getLeafByPath, getTreeLeaves, updateBranchByPath} from "common/tree"
import {UUID, getRandomUUID} from "common/uuid"
import {NamedId} from "data/project"
import {Icon} from "generated/icons"
import {useRef} from "react"


export const ModelSelector = () => {
	const [project, setProject] = useProject()
	const modelMap = new Map(project.models.map(model => [model.id, model]))
	const modelTree = project.modelTree
	const {matchedUrl} = useRoutingContext()
	const treeControls = useRef<TreeControls | null>(null)

	const addDirectory = () => {
		const newDirectory: Tree<UUID, NamedId> = {
			value: {
				id: getRandomUUID(),
				name: "New Directory"
			},
			children: []
		}
		setProject(project => ({
			...project,
			modelTree: [newDirectory, ...project.modelTree]
		}))

		treeControls?.current?.setInlineEditPath?.([0])
	}

	const onBranchNameChange = (path: TreePath, newLabel: string) => {
		setProject(project => {
			const oldModels = project.modelTree
			const newModels = updateBranchByPath(oldModels, path, dir => ({...dir, value: {...dir.value, name: newLabel}}))
			return {
				...project,
				modelTree: newModels
			}
		})
	}

	const onLeafNameChange = (path: TreePath, newLabel: string) => {
		setProject(project => {
			const leaf = getLeafByPath(project.modelTree, path)
			let model = modelMap.get(leaf.value)
			if(!model){
				throw new Error("No model for id " + leaf.value)
			}
			model = {...model, name: newLabel}
			return {
				...project,
				models: [...project.models.filter(x => x.id !== leaf.value), model]
			}
		})
	}

	const onDirectoryDelete = (path: TreePath) => {
		setProject(project => {
			const branch = getBranchByPath(project.modelTree, path)

			const modelIds: UUID[] = []
			for(const [, modelId] of getTreeLeaves(branch)){
				modelIds.push(modelId)
			}
			const modelIdSet = new Set(modelIds)
			const models = project.models.filter(model => !modelIdSet.has(model.id))
			const modelTree = deleteTreeByPath(project.modelTree, path)
			return {...project, models, modelTree}
		})
	}

	const onModelDelete = (path: TreePath) => {
		setProject(project => {
			const leaf = getLeafByPath(project.modelTree, path)
			const models = project.models.filter(model => model.id !== leaf.value)
			const modelTree = deleteTreeByPath(project.modelTree, path)
			return {...project, models, modelTree}
		})
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
					<Button text="Add directory" icon={Icon.folderPlus} onClick={addDirectory}/>
					<Button text="Add model" icon={Icon.filePlus}/>
				</Row>
				<TreeView
					tree={modelTree}
					controlRef={treeControls}
					onLeafDoubleclick={id => pushHistory(appendUrlPath(matchedUrl, `./${id}`))}
					getBranchKey={x => x.id}
					getLeafKey={x => x}
					getBranchLabel={x => x.name}
					getLeafLabel={x => modelMap.get(x)?.name ?? "<???>"}
					onBranchLabelEdit={onBranchNameChange}
					onLeafLabelEdit={onLeafNameChange}
					onBranchDelete={onDirectoryDelete}
					onLeafDelete={onModelDelete}/>
			</Col>
		</Col>
	)
}
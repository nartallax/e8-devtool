import {Button} from "client/components/button/button"
import {Row} from "client/components/row_col/row_col"
import {SearchableTreeView, SearchableTreeViewProps} from "client/components/tree_view/searchable_tree_view"
import {TreeControls} from "client/components/tree_view/tree_view"
import {Tree, TreePath, addTreeByPath, isTreeBranch} from "common/tree"
import {getRandomUUID} from "common/uuid"
import {Icon} from "generated/icons"
import {useCallback, useMemo, useRef, useState} from "react"

export type TreeViewWithCreationProps<L, B> = Omit<SearchableTreeViewProps<L, B>, "onLabelEdit" | "onLabelEditCancel" | "onAddChild" | "controlRef"> & {
	itemName?: string
	onRename?: (path: TreePath, newName: string, node: Tree<L, B>) => void
	onLeafCreated?: (name: string, path: TreePath) => void
	onBranchCreated?: (name: string, path: TreePath) => void
	buttons?: () => React.ReactNode
}

const createdNodeId = "new_node_" + getRandomUUID()

export const TreeViewWithElementCreation = <L, B>({
	onRename, onLeafCreated, onBranchCreated, buttons, tree: srcTree, itemName,
	getLeafLabel, getBranchLabel, getLeafSublabel, getBranchSublabel, getLeafKey, getBranchKey, ...props
}: TreeViewWithCreationProps<L, B>) => {
	const [createdNode, setCreatedNode] = useState<{
		node: Tree<string, string>
		path: TreePath
	} | null>(null)

	const treeControls = useRef<TreeControls | null>(null)

	const tree = useMemo(() => {
		let tree = srcTree
		if(createdNode){
			// yeah, that's weird. but treeview won't mind.
			tree = addTreeByPath(tree, createdNode.node as any, createdNode.path)
		}
		return tree
	}, [srcTree, createdNode])

	const onEdit = !onRename ? undefined : (path: TreePath, newLabel: string, node: Tree<L, B>) => {
		if(node !== createdNode?.node){
			onRename(path, newLabel, node)
			return
		}

		if(isTreeBranch(node)){
			onBranchCreated!(newLabel, path)
		} else {
			onLeafCreated!(newLabel, path)
		}
		setCreatedNode(null)
	}

	const onEditCancel = (_: TreePath, node: Tree<L, B>) => {
		if(node === createdNode?.node){
			setCreatedNode(null)
		}
	}

	const addRenameNode = useCallback((isBranch: boolean, path: TreePath = [0]) => {
		setCreatedNode({node: isBranch ? {value: "", children: []} : {value: ""}, path})
		treeControls.current?.setInlineEditPath(path)
	}, [])

	const onAddChild = !onLeafCreated ? undefined : (path: TreePath) => {
		setCreatedNode({node: {value: ""}, path})
	}

	const addRenameBranch = !onBranchCreated ? undefined : () => {
		return addRenameNode(true)
	}
	const addRenameLeaf = !onLeafCreated ? undefined : () => {
		addRenameNode(false)
	}

	return (
		<>
			{(!!buttons || !!addRenameBranch || !!addRenameLeaf) && <Row justify="start" gap>
				<>
					{addRenameBranch && <Button text="Add directory" icon={Icon.folderPlus} onClick={addRenameBranch}/>}
					{addRenameLeaf && <Button text={`Add ${itemName}`} icon={Icon.filePlus} onClick={addRenameLeaf}/>}
					{buttons?.()}
				</>
			</Row>}
			<SearchableTreeView
				{...props}
				getLeafLabel={(leaf, path, node) => node === createdNode?.node ? "" : getLeafLabel(leaf, path, node)}
				getBranchLabel={!getBranchLabel ? undefined : (branch, path, node) => node === createdNode?.node ? "" : getBranchLabel(branch, path, node)}
				getLeafSublabel={!getLeafSublabel ? undefined : (leaf, path, node) => node === createdNode?.node ? "" : getLeafSublabel(leaf, path, node)}
				getBranchSublabel={!getBranchSublabel ? undefined : (branch, path, node) => node === createdNode?.node ? "" : getBranchSublabel(branch, path, node)}
				getLeafKey={(leaf, path, node) => node === createdNode?.node ? createdNodeId : getLeafKey(leaf, path, node)}
				getBranchKey={!getBranchKey ? undefined : (branch, path, node) => node === createdNode?.node ? createdNodeId : getBranchKey(branch, path, node)}
				onAddChild={onAddChild}
				tree={tree}
				onLabelEdit={onEdit}
				onLabelEditCancel={onEditCancel}
				controlRef={treeControls}
			/>
		</>
	)
}
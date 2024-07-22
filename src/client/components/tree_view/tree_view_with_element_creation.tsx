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
	onRename, onLeafCreated, onBranchCreated, buttons, forest: srcForest, itemName,
	getLeafLabel, getBranchLabel, getLeafSublabel, getBranchSublabel, getLeafKey, getBranchKey, ...props
}: TreeViewWithCreationProps<L, B>) => {
	const [createdNode, setCreatedNode] = useState<{
		node: Tree<string, string>
		path: TreePath
	} | null>(null)

	const treeControls = useRef<TreeControls | null>(null)

	const forest = useMemo(() => {
		let tree = srcForest
		if(createdNode){
			// yeah, that's weird. but treeview won't mind.
			tree = addTreeByPath(tree, createdNode.node as any, createdNode.path)
		}
		return tree
	}, [srcForest, createdNode])

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
		addRenameNode(false, [...path, 0])
	}

	const addRenameBranch = !onBranchCreated ? undefined : () => {
		return addRenameNode(true)
	}
	const addRenameLeaf = !onLeafCreated ? undefined : () => {
		addRenameNode(false)
	}

	function shiftPathByCreatedNode(path: TreePath): TreePath {
		if(!createdNode){
			return path
		}
		const createdPath = createdNode.path
		if(createdPath.length > path.length){
			return path
		}
		if(createdPath[path.length - 1]! < path[path.length - 1]!){
			path = [...path]
			path[path.length - 1]--
		}
		return path
	}

	function getKey<V extends L | B, T extends Tree<L, B>>(innerGetKey?: (tree: V, path: TreePath, node: T) => string) {
		return (tree: V, path: TreePath, node: T) => {
			if(createdNode){
				if(node === createdNode.node){
					return createdNodeId
				}
				path = shiftPathByCreatedNode(path)
			}

			return !innerGetKey ? "<no key function provided>" : innerGetKey(tree, path, node)
		}
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
				getLeafLabel={(leaf, path, node) => node === createdNode?.node ? "" : getLeafLabel(leaf, shiftPathByCreatedNode(path), node)}
				getBranchLabel={!getBranchLabel ? undefined : (branch, path, node) => node === createdNode?.node ? "" : getBranchLabel(branch, shiftPathByCreatedNode(path), node)}
				getLeafSublabel={!getLeafSublabel ? undefined : (leaf, path, node) => node === createdNode?.node ? "" : getLeafSublabel(leaf, shiftPathByCreatedNode(path), node)}
				getBranchSublabel={!getBranchSublabel ? undefined : (branch, path, node) => node === createdNode?.node ? "" : getBranchSublabel(branch, shiftPathByCreatedNode(path), node)}
				getLeafKey={getKey(getLeafKey)}
				getBranchKey={getKey(getBranchKey)}
				onAddChild={onAddChild}
				forest={forest}
				onLabelEdit={onEdit}
				onLabelEditCancel={onEditCancel}
				controlRef={treeControls}
			/>
		</>
	)
}
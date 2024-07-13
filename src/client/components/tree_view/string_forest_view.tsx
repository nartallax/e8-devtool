import {TreeViewWithCreationProps, TreeViewWithElementCreation} from "client/components/tree_view/tree_view_with_element_creation"
import {Tree, TreePath, getTreeByPath, treePathToValues, treeValuesToTreePath} from "common/tree"
import {splitPath} from "data/project_utils"
import {useMemo} from "react"

type Props = ReadonlyProps | MutableProps

type ReadonlyProps = {
	forest: Tree<string, string>[]
	makePath: (parts: string[], isPrefix: boolean) => string
	selectedPath?: string | null
	onItemClick?: (path: string, isBranch: boolean) => void
	onItemDoubleclick?: (path: string, isBranch: boolean) => void
	isBranchClickable?: boolean
	buttons?: () => React.ReactNode
}

type MutableProps = ReadonlyProps & {
	itemName: string
	// those handlers are a bit too verbose, but that's fine, because they are supposed to come from data provider
	// actual end-user of this component shouldn't ever need to define those handlers
	createNode: (node: Tree<string, string>, path: TreePath) => void
	moveNode: (node: Tree<string, string>, fromPath: TreePath, toPath: TreePath) => void
	renameNode: (node: Tree<string, string>, path: TreePath, newName: string) => void
	deleteNode: (node: Tree<string, string>, path: TreePath) => void
}

const arePropsMutable = (x: unknown): x is MutableProps => !!x && typeof(x) === "object" && !!(x as MutableProps).moveNode

export const StringForestView = ({
	forest, makePath, selectedPath, onItemClick, onItemDoubleclick, isBranchClickable, buttons, ...props
}: Props) => {

	const selectedTreePath = useMemo(() =>
		!selectedPath ? undefined : treeValuesToTreePath(forest, splitPath(selectedPath)) ?? undefined
	, [forest, selectedPath])

	let innerProps: TreeViewWithCreationProps<string, string> = {
		tree: forest,
		getLeafKey: (_, path) => makePath(treePathToValues(forest, path), false),
		getBranchKey: (_, path) => makePath(treePathToValues(forest, path), true),
		getLeafLabel: str => str,
		getBranchLabel: str => str,
		itemName: "item",
		onLeafClick: !onItemClick ? undefined : (_, path) => onItemClick(makePath(treePathToValues(forest, path), false), false),
		onLeafDoubleclick: !onItemDoubleclick ? undefined : (_, path) => onItemDoubleclick(makePath(treePathToValues(forest, path), false), false),
		onBranchClick: !onItemClick || !isBranchClickable ? undefined : (_, path) => onItemClick(makePath(treePathToValues(forest, path), true), true),
		onBranchDoubleclick: !onItemDoubleclick || !isBranchClickable ? undefined : (_, path) => onItemDoubleclick(makePath(treePathToValues(forest, path), true), true),
		selectedPath: selectedTreePath,
		buttons
	}

	if(arePropsMutable(props)){
		const {
			itemName, createNode, deleteNode, moveNode, renameNode
		} = props
		innerProps = {
			...innerProps,
			itemName,
			onLeafCreated: (name, path) => createNode({value: name}, path),
			onBranchCreated: (name, path) => createNode({value: name, children: []}, path),
			onDelete: (path, node) => deleteNode(node, path),
			onDrag: (from, to) => moveNode(getTreeByPath(forest, from), from, to),
			onRename: (path, name, node) => renameNode(node, path, name)
		}
	}

	return (
		<TreeViewWithElementCreation {...innerProps}/>
	)

}
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
}

type MutableProps = ReadonlyProps & {
	itemName: string
	// those handlers are a bit too verbose, but that's fine, because they are supposed to come from data provider
	// actual end-user of this component shouldn't ever need to define those handlers
	onNodeCreated: (node: Tree<string, string>, path: TreePath) => void
	onNodeMoved: (node: Tree<string, string>, fromPath: TreePath, toPath: TreePath) => void
	onNodeRenamed: (node: Tree<string, string>, path: TreePath, newName: string) => void
	onNodeDeleted: (node: Tree<string, string>, path: TreePath) => void
}

const arePropsMutable = (x: unknown): x is MutableProps => !!x && typeof(x) === "object" && !!(x as MutableProps).onNodeMoved

export const StringForestView = ({
	forest, makePath, selectedPath, onItemClick, onItemDoubleclick, isBranchClickable, ...props
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
		selectedPath: selectedTreePath
	}

	if(arePropsMutable(props)){
		const {
			itemName, onNodeCreated, onNodeDeleted, onNodeMoved, onNodeRenamed
		} = props
		innerProps = {
			...innerProps,
			itemName,
			onLeafCreated: (name, path) => onNodeCreated({value: name}, path),
			onBranchCreated: (name, path) => onNodeCreated({value: name, children: []}, path),
			onDelete: (path, node) => onNodeDeleted(node, path),
			onDrag: (from, to) => onNodeMoved(getTreeByPath(forest, from), from, to),
			onRename: (path, name, node) => onNodeRenamed(node, path, name)
		}
	}

	return (
		<TreeViewWithElementCreation {...innerProps}/>
	)

}
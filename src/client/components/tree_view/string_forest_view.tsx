import {Forest, ForestPath, Tree, areForestPathsEqual} from "@nartallax/forest"
import {ValidatorSets} from "client/components/form/validators"
import {TreeViewWithCreationProps, TreeViewWithElementCreation} from "client/components/tree_view/tree_view_with_element_creation"
import {replaceLastPathPart, splitPath} from "data/project_utils"
import {useMemo} from "react"

type Props = ReadonlyProps | SelectableProps | MutableProps | MutableSelectableProps

type ReadonlyProps = {
	trees: readonly Tree<string, string>[]
	makePath: (parts: string[], isPrefix: boolean) => string
	onItemClick?: (path: string, isBranch: boolean) => void
	onItemDoubleclick?: (path: string, isBranch: boolean) => void
	getItemSublabel?: (path: string) => string
	isBranchClickable?: boolean
	buttons?: () => React.ReactNode
}

type SelectableProps = ReadonlyProps & {
	selectedPath: string | null
}

type MutableProps = ReadonlyProps & {
	itemName: string
	// those handlers are a bit too verbose, but that's fine, because they are supposed to come from data provider
	// actual end-user of this component shouldn't ever need to define those handlers
	createNode: (node: Tree<string, string>, path: ForestPath) => void
	moveNode: (node: Tree<string, string>, fromPath: ForestPath, toPath: ForestPath) => void
	renameNode: (node: Tree<string, string>, path: ForestPath, newName: string) => void
	deleteNode: (node: Tree<string, string>, path: ForestPath) => void
}

type MutableSelectableProps = SelectableProps & MutableProps & {
	/** You should supply this function if your tree is mutable and selectable.
	It will be called in case when a node is moved/renamed */
	setSelectedPath: (path: string | null) => void
}

const arePropsMutable = (x: unknown): x is MutableProps => !!x && typeof(x) === "object" && !!(x as MutableProps).moveNode
const arePropsSelectable = (x: unknown): x is SelectableProps => !!x && typeof(x) === "object" && (x as SelectableProps).selectedPath !== undefined
const arePropsMutableSelectable = (x: unknown): x is MutableSelectableProps => !!x && typeof(x) === "object" && (x as SelectableProps).selectedPath !== undefined

export const StringForestView = ({
	trees, makePath, onItemClick, onItemDoubleclick, isBranchClickable, buttons, getItemSublabel, ...props
}: Props) => {
	const selectedPath: string | null = arePropsSelectable(props) ? props.selectedPath : null
	const selectedTreePath = useMemo(() => {
		if(!selectedPath){
			return undefined
		}

		return new Forest(trees).valuesToPath(splitPath(selectedPath)) ?? undefined
	}, [trees, selectedPath])

	let innerProps: TreeViewWithCreationProps<string, string> = {
		forest: trees,
		getSearchText: leaf => leaf,
		getLeafKey: (_, path) => makePath(new Forest(trees).pathToValues(path), false),
		getBranchKey: (_, path) => makePath(new Forest(trees).pathToValues(path), true),
		getLeafLabel: str => str,
		getBranchLabel: str => str,
		itemName: "item",
		onLeafClick: !onItemClick ? undefined : (_, path) => onItemClick(makePath(new Forest(trees).pathToValues(path), false), false),
		onLeafDoubleclick: !onItemDoubleclick ? undefined : (_, path) => onItemDoubleclick(makePath(new Forest(trees).pathToValues(path), false), false),
		onBranchClick: !onItemClick || !isBranchClickable ? undefined : (_, path) => onItemClick(makePath(new Forest(trees).pathToValues(path), true), true),
		onBranchDoubleclick: !onItemDoubleclick || !isBranchClickable ? undefined : (_, path) => onItemDoubleclick(makePath(new Forest(trees).pathToValues(path), true), true),
		selectedPath: selectedTreePath,
		buttons,
		getLeafSublabel: !getItemSublabel ? undefined : (_, path) => getItemSublabel(makePath(new Forest(trees).pathToValues(path), false)),
		// wonder if this should be a prop, or perahaps separate control
		// we only ever use this control for FS trees, so it makes sense to do this
		leafLabelValidators: ValidatorSets.path,
		branchLabelValidators: ValidatorSets.path
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
			onDrag: (from, to) => moveNode(new Forest(trees).getTreeAt(from), from, to),
			onRename: (path, name, node) => renameNode(node, path, name)
		}

		if(arePropsMutableSelectable(props)){
			const setSelectedPath = props.setSelectedPath
			const {onDelete, onDrag, onRename} = innerProps
			innerProps = {
				...innerProps,
				onDelete: async(path, node) => {
					await Promise.resolve(onDelete!(path, node))
					if(selectedTreePath && areForestPathsEqual(selectedTreePath, path)){
						setSelectedPath(null)
					}
				},
				onRename: async(path, name, node) => {
					await Promise.resolve(onRename!(path, name, node))
					if(selectedPath && selectedTreePath && areForestPathsEqual(selectedTreePath, path)){
						setSelectedPath(replaceLastPathPart(selectedPath, name))
					}
				},
				onDrag: async(from, to) => {
					await Promise.resolve(onDrag!(from, to))
					if(selectedTreePath && areForestPathsEqual(selectedTreePath, from)){
						// this is not very efficient, but we don't really have another choice
						// we don't have any guarantees that forest will be updated after onDrag handler is resolved
						// (it should, but React is asyncronous and sometimes doesn't re-render everything in time)
						// that's why we can't just put forest in a ref and use this ref
						// and that's why we are moving nodes manually, despite onDrag probably doing the same
						const newForest = new Forest(trees).move(from, to)
						setSelectedPath(makePath(newForest.pathToValues(to), false))
					}
				}
			}
		}
	}

	return (
		<TreeViewWithElementCreation {...innerProps}/>
	)

}
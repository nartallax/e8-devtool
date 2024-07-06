import {Button} from "client/components/button/button"
import {MappedNamedIdTreeView, NullableNamedId} from "client/components/tree_view/mapped_named_id_tree_view"
import {Tree, TreePath, mapTree, treePathToValues} from "common/tree"
import {UUID, getHashUUID} from "common/uuid"
import {Icon} from "generated/icons"
import {useMemo} from "react"

type Props<T> = ReadonlyProps<T> | MutableProps<T>

type ReadonlyProps<T> = {
	forest: Tree<string, string>[]
	mapObject: Record<string, T>
	getObjectKey: (parts: string[], isPrefix: boolean) => string
	selectedItem?: T | null
	onItemClick?: (item: T, path: TreePath) => void
	onItemDoubleclick?: (item: T, path: TreePath) => void
	onBranchClick?: (item: T | undefined, path: TreePath) => void
	onBranchDoubleClick?: (item: T | undefined, path: TreePath) => void
	buttons?: () => React.ReactNode
	getItemSublabel?: (item: T) => string | null
}

type MutableProps<T> = ReadonlyProps<T> & {
	itemName: string
	createItem: () => T
	onForestChange: (newForest: Tree<string, string>[]) => void
	onMapChange: (newMap: Record<string, T>) => void
	beforeItemDelete?: (item: T) => void
}

const arePropsMutable = (x: unknown): x is MutableProps<unknown> => typeof(x) === "object" && !!x && "itemName" in x

/** TreeView of a string forest.
Each leaf of this forest is supposed to have an attached value, linked by path - @param mapObject is a map from path string to linked value.
@param mapObject can also contain values for branches; this can be useful if branches are supposed to be selectable.
Paths are expected to be hierarchical and have separators, root goes first.
No other assumptions about paths are made;
@param getObjectKey is supposed to be a converter from array of tree elements to path (or prefix) in @param mapObject */
export function MappedForestView<T>({
	getObjectKey, forest, mapObject, onItemDoubleclick, buttons, onItemClick, selectedItem, getItemSublabel, onBranchClick, onBranchDoubleClick, ...props
}: Props<T>) {

	const getPathString = (path: TreePath, addedPart?: string, isPrefix?: boolean): string => {
		const parts = treePathToValues(forest, path)
		if(addedPart){
			parts.push(addedPart)
		}
		return getObjectKey(parts, !!isPrefix)
	}

	const getPathUUID = (path: TreePath, addedPart?: string, isPrefix?: boolean): UUID => {
		return getHashUUID(getPathString(path, addedPart, isPrefix))
	}

	const selectedUUID = useMemo(() => {
		if(selectedItem === null){
			return null
		}
		for(const key in mapObject){
			if(mapObject[key] === selectedItem){
				return getHashUUID(key)
			}
		}
		return null
	}, [mapObject, selectedItem])

	let nestedProps: React.ComponentProps<typeof MappedNamedIdTreeView<NullableNamedId, NullableNamedId, Tree<NullableNamedId, NullableNamedId>, Tree<string, string>>> = {
		isSearchable: true,
		values: forest,
		toTree: (node: Tree<string, string>, path: TreePath): Tree<NullableNamedId, NullableNamedId> => mapTree(node,
			(name, path) => {
				return {id: getPathUUID(path), name}
			},
			(name, path) => {
				return {id: getPathUUID(path, undefined, true), name}
			},
			path
		),
		fromTree: (node: Tree<NullableNamedId, NullableNamedId>): Tree<string, string> => mapTree(node,
			namedId => namedId.name,
			namedId => namedId.name,
			[]
		),
		onLeafClick: !onItemClick ? undefined : (_, path) => {
			const pathStr = getObjectKey(treePathToValues(forest, path), false)
			onItemClick(mapObject[pathStr]!, path)
		},
		onLeafDoubleclick: !onItemDoubleclick ? undefined : (_, path) => {
			const pathStr = getObjectKey(treePathToValues(forest, path), false)
			onItemDoubleclick(mapObject[pathStr]!, path)
		},
		onBranchClick: !onBranchClick ? undefined : (_, path) => {
			const pathStr = getObjectKey(treePathToValues(forest, path), true)
			onBranchClick(mapObject[pathStr], path)
		},
		onBranchDoubleclick: !onBranchDoubleClick ? undefined : (_, path) => {
			const pathStr = getObjectKey(treePathToValues(forest, path), true)
			onBranchDoubleClick(mapObject[pathStr], path)
		},
		selectedValue: selectedUUID,
		getLeafSublabel: !getItemSublabel ? undefined : (_, path) => {
			const pathStr = getPathString(path)
			return getItemSublabel(mapObject[pathStr]!)
		},
		buttons
	}

	if(arePropsMutable(props)){
		const {
			itemName, createItem, onForestChange, onMapChange, beforeItemDelete
		} = props

		const onItemCreated = (name: string, path: TreePath) => {
			const pathStr = getPathString(path.slice(0, -1), name)
			const item = createItem()
			onMapChange({...mapObject, [pathStr]: item})
			return {name, id: getHashUUID(pathStr)}
		}

		const onBranchRename = (oldPrefix: string, newPrefix: string) => {
			const map: Record<string, T> = {}
			for(const [oldModelPath, model] of Object.entries(mapObject)){
				let pathStr = oldModelPath
				if(pathStr.startsWith(oldPrefix)){
					pathStr = newPrefix + pathStr.substring(oldPrefix.length)
				}
				map[pathStr] = model
			}
			onMapChange(map)
		}

		nestedProps = {
			...nestedProps,
			onChange: onForestChange,
			canBeChildOf: () => true,
			buttons: controls => (
				<>
					<Button text="Add directory" icon={Icon.folderPlus} onClick={() => controls.addRenameBranch()}/>
					<Button
						text={`Add ${itemName}`}
						icon={Icon.filePlus}
						onClick={() => controls.addRenameLeaf()}
					/>
					{buttons?.()}
				</>
			),
			onLeafCreated: onItemCreated,
			onBranchCreated: (name, path) => {
				return {id: getPathUUID(path.slice(0, -1), name, true), name}
			},
			onLeafDelete: (_, path) => {
				const pathStr = getPathString(path)
				if(beforeItemDelete){
					const item = mapObject[pathStr]!
					beforeItemDelete(item)
				}
				const map = {...mapObject}
				delete map[pathStr]
				onMapChange(map)
			},
			beforeBranchRename: (_, name, path) => {
				const oldPrefix = getPathString(path, undefined, true)
				const newPrefix = getPathString(path.slice(0, -1), name, true)
				onBranchRename(oldPrefix, newPrefix)
			},
			beforeLeafRename: (_, name, path) => {
				const map = {...mapObject}
				const oldPathStr = getPathString(path)
				const item = map[oldPathStr]!
				delete map[oldPathStr]
				const newPathStr = getPathString(path.slice(0, -1), name)
				map[newPathStr] = item
				onMapChange(map)
			},
			beforeLeafDragCompleted: (oldPath, newPath, leaf) => {
				const map = {...mapObject}
				const oldPathStr = getPathString(oldPath)
				const newPathStr = getPathString(newPath.slice(0, -1), leaf.name)
				if(oldPathStr === newPathStr){
					return
				}
				map[newPathStr] = map[oldPathStr]!
				delete map[oldPathStr]
				onMapChange(map)
			},
			beforeBranchDragCompleted: (oldPath, newPath, branch) => {
				const oldPrefix = getPathString(oldPath, undefined, true)
				const newPrefix = getPathString(newPath.slice(0, -1), branch.name, true)
				onBranchRename(oldPrefix, newPrefix)
			}
		}
	}

	return (
		<MappedNamedIdTreeView {...nestedProps}/>
	)
}
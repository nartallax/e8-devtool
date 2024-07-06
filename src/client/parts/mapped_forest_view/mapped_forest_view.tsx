import {Button} from "client/components/button/button"
import {MappedNamedIdTreeView, NullableNamedId} from "client/components/tree_view/mapped_named_id_tree_view"
import {Tree, TreePath, mapTree} from "common/tree"
import {getHashUUID} from "common/uuid"
import {getTreePathStr} from "data/project_utils"
import {Icon} from "generated/icons"
import {useMemo} from "react"

type Props<T> = ReadonlyProps<T> | MutableProps<T>

type ReadonlyProps<T> = {
	forest: Tree<string, string>[]
	mapObject: Record<string, T>
	selectedItem?: T | null
	onItemClick?: (item: T, path: TreePath) => void
	onItemDoubleclick?: (item: T, path: TreePath) => void
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

export function MappedForestView<T>({
	forest, mapObject, onItemDoubleclick, buttons, onItemClick, selectedItem, getItemSublabel, ...props
}: Props<T>) {

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
				const pathStr = getTreePathStr(forest, path)
				return {id: getHashUUID(pathStr), name}
			},
			(name, path) => {
				const pathStr = getTreePathStr(forest, path, undefined, "branch")
				return {id: getHashUUID(pathStr), name}
			},
			path
		),
		fromTree: (node: Tree<NullableNamedId, NullableNamedId>): Tree<string, string> => mapTree(node,
			namedId => namedId.name,
			namedId => namedId.name,
			[]
		),
		onLeafClick: !onItemClick ? undefined : (_, path) => {
			const pathStr = getTreePathStr(forest, path)
			onItemClick(mapObject[pathStr]!, path)
		},
		onLeafDoubleclick: !onItemDoubleclick ? undefined : (_, path) => {
			const pathStr = getTreePathStr(forest, path)
			onItemDoubleclick(mapObject[pathStr]!, path)
		},
		selectedValue: selectedUUID,
		getLeafSublabel: !getItemSublabel ? undefined : (_, path) => {
			const pathStr = getTreePathStr(forest, path)
			return getItemSublabel(mapObject[pathStr]!)
		},
		buttons
	}

	if(arePropsMutable(props)){
		const {
			itemName, createItem, onForestChange, onMapChange, beforeItemDelete
		} = props

		const onItemCreated = (name: string, path: TreePath) => {
			const pathStr = getTreePathStr(forest, path.slice(0, -1), name)
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
				const pathStr = getTreePathStr(forest, path.slice(0, -1), name, "branch")
				return {id: getHashUUID(pathStr), name}
			},
			onLeafDelete: (_, path) => {
				const pathStr = getTreePathStr(forest, path)
				if(beforeItemDelete){
					const item = mapObject[pathStr]!
					beforeItemDelete(item)
				}
				const map = {...mapObject}
				delete map[pathStr]
				onMapChange(map)
			},
			beforeBranchRename: (_, name, path) => {
				const oldPrefix = getTreePathStr(forest, path, undefined, "branch")
				const newPrefix = getTreePathStr(forest, path.slice(0, -1), name, "branch")
				onBranchRename(oldPrefix, newPrefix)
			},
			beforeLeafRename: (_, name, path) => {
				const map = {...mapObject}
				const oldPathStr = getTreePathStr(forest, path)
				const item = map[oldPathStr]!
				delete map[oldPathStr]
				const newPathStr = getTreePathStr(forest, path.slice(0, -1), name)
				map[newPathStr] = item
				onMapChange(map)
			},
			beforeLeafDragCompleted: (oldPath, newPath, leaf) => {
				const map = {...mapObject}
				const oldPathStr = getTreePathStr(forest, oldPath)
				const newPathStr = getTreePathStr(forest, newPath.slice(0, -1), leaf.name)
				if(oldPathStr === newPathStr){
					return
				}
				map[newPathStr] = map[oldPathStr]!
				delete map[oldPathStr]
				onMapChange(map)
			},
			beforeBranchDragCompleted: (oldPath, newPath, branch) => {
				const oldPrefix = getTreePathStr(forest, oldPath, undefined, "branch")
				const newPrefix = getTreePathStr(forest, newPath.slice(0, -1), branch.name, "branch")
				onBranchRename(oldPrefix, newPrefix)
			}
		}

	}

	return (
		<MappedNamedIdTreeView {...nestedProps}/>
	)
}
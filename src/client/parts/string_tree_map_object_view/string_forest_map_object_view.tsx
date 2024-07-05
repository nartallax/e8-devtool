import {Button} from "client/components/button/button"
import {MappedNamedIdTreeView} from "client/components/tree_view/mapped_named_id_tree_view"
import {Tree, TreePath, mapTree} from "common/tree"
import {getHashUUID} from "common/uuid"
import {getTreePathStr} from "data/project_utils"
import {Icon} from "generated/icons"

type Props<T> = {
	itemName: string
	createItem: () => T
	forest: Tree<string, string>[]
	mapObject: Record<string, T>
	onForestChange: (newForest: Tree<string, string>[]) => void
	onMapChange: (newMap: Record<string, T>) => void
	onItemDoubleclick?: (path: TreePath) => void
}

export function StringForestMapObjectView<T>({
	forest, mapObject, onForestChange, itemName, createItem, onMapChange, onItemDoubleclick
}: Props<T>) {

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

	return (
		<MappedNamedIdTreeView
			isSearchable
			values={forest}
			toTree={(node, path) => mapTree(node,
				(name, path) => {
					const pathStr = getTreePathStr(forest, path)
					return {id: getHashUUID(pathStr), name}
				},
				(name, path) => {
					const pathStr = getTreePathStr(forest, path, undefined, "branch")
					return {id: getHashUUID(pathStr), name}
				},
				path
			)}
			fromTree={node => mapTree(node, namedId => namedId.name, namedId => namedId.name, [])}
			onChange={onForestChange}
			canBeChildOf={() => true}
			buttons={controls => (
				<>
					<Button text="Add directory" icon={Icon.folderPlus} onClick={() => controls.addRenameBranch()}/>
					<Button
						text={`Add ${itemName}`}
						icon={Icon.filePlus}
						onClick={() => controls.addRenameLeaf()}
					/>
				</>
			)}
			onLeafCreated={onItemCreated}
			onBranchCreated={(name, path) => {
				const pathStr = getTreePathStr(forest, path.slice(0, -1), name, "branch")
				return {id: getHashUUID(pathStr), name}
			}}
			onLeafDelete={(_, path) => {
				const map = {...mapObject}
				const pathStr = getTreePathStr(forest, path)
				delete map[pathStr]
				onMapChange(map)
			}}
			onLeafDoubleclick={!onItemDoubleclick ? undefined : (_, path) => onItemDoubleclick(path)}
			beforeBranchRename={(_, name, path) => {
				const oldPrefix = getTreePathStr(forest, path, undefined, "branch")
				const newPrefix = getTreePathStr(forest, path.slice(0, -1), name, "branch")
				onBranchRename(oldPrefix, newPrefix)
			}}
			beforeLeafRename={(_, name, path) => {
				const map = {...mapObject}
				const oldPathStr = getTreePathStr(forest, path)
				const item = map[oldPathStr]!
				delete map[oldPathStr]
				const newPathStr = getTreePathStr(forest, path.slice(0, -1), name)
				map[newPathStr] = item
				onMapChange(map)
			}}
			beforeLeafDragCompleted={(oldPath, newPath, leaf) => {
				const map = {...mapObject}
				const oldPathStr = getTreePathStr(forest, oldPath)
				const newPathStr = getTreePathStr(forest, newPath.slice(0, -1), leaf.name)
				if(oldPathStr === newPathStr){
					return
				}
				map[newPathStr] = map[oldPathStr]!
				delete map[oldPathStr]
				onMapChange(map)
			}}
			beforeBranchDragCompleted={(oldPath, newPath, branch) => {
				const oldPrefix = getTreePathStr(forest, oldPath, undefined, "branch")
				const newPrefix = getTreePathStr(forest, newPath.slice(0, -1), branch.name, "branch")
				onBranchRename(oldPrefix, newPrefix)
			}}
		/>
	)
}
import {UnsavedChanges} from "client/components/unsaved_changes_context/unsaved_changes_context"
import {useSaveableState} from "client/components/unsaved_changes_context/use_saveable_state"
import {useProject} from "client/parts/project_context"
import {SetState} from "client/ui_utils/react_types"
import {Tree, TreePath, addTreeByPath, deleteFromTreeByPath, isTreeBranch, isTreeLeaf, moveTreeByPath, updateTreeByPath} from "common/tree"
import {Project} from "data/project"
import {treePathToString} from "data/project_utils"
import {useCallback} from "react"

type ProjectSaveableForestProps = {
	forestName: keyof Project
	mapName: keyof Project
}

type ProjectSaveableForestAddedProps = {
	forest: Tree<string, string>[]
	setForest: SetState<Tree<string, string>[]>
	onNodeCreated: (node: Tree<string, string>, path: TreePath) => Promise<void>
	onNodeMoved: (node: Tree<string, string>, fromPath: TreePath, toPath: TreePath) => Promise<void>
	onNodeRenamed: (node: Tree<string, string>, path: TreePath, newName: string) => Promise<void>
	onNodeDeleted: (node: Tree<string, string>, path: TreePath) => Promise<void>
}

type NestedProps<T, P> = {
	createItem: (props: P) => T
}

/** Saveable data wrapper for case "forest is edited separately from related data"
This wrapper is just for editing forest. Related data can be created, deleted or moved (aka renamed), but that's it.
TODO: This is legacy wrapper. It should be replaced with actual loading and saving data in API */
export function makeProjectSaveableForestWrapper<T>({
	forestName, mapName
}: ProjectSaveableForestProps) {
	return function withProjectSaveableMappedForest<P extends object>(
		{createItem}: NestedProps<T, P>,
		Component: React.FC<P & ProjectSaveableForestAddedProps>
	) {
		return function WrapperComponent(props: P) {

			const [project, setProject] = useProject()
			const {
				isUnsaved, setState: setMapForest, save, state: {map, forest}
			} = useSaveableState({
				map: project[mapName] as Record<string, T>,
				forest: project[forestName] as Tree<string, string>[]
			}, ({map, forest}) => setProject(project => ({
				...project,
				[mapName]: map,
				[forestName]: forest
			})))

			const setMap = useCallback((valueOrCallback: Record<string, T> | ((oldValue: Record<string, T>) => Record<string, T>)) => {
				setMapForest(mapForest => ({
					...mapForest,
					map: typeof(valueOrCallback) === "function" ? valueOrCallback(mapForest.map) : valueOrCallback
				}))
			}, [setMapForest])

			const setForest = useCallback((valueOrCallback: Tree<string, string>[] | ((oldValue: Tree<string, string>[]) => Tree<string, string>[])) => {
				setMapForest(mapForest => ({
					...mapForest,
					forest: typeof(valueOrCallback) === "function" ? valueOrCallback(mapForest.forest) : valueOrCallback
				}))
			}, [setMapForest])

			const updateMapByPrefix = (oldPrefix: string, newPrefix: string) => {
				const newMap: Record<string, T> = {}
				for(const [oldModelPath, model] of Object.entries(map)){
					let pathStr = oldModelPath
					if(pathStr.startsWith(oldPrefix)){
						pathStr = newPrefix + pathStr.substring(oldPrefix.length)
					}
					newMap[pathStr] = model
				}
				setMap(newMap)
			}

			const onNodeCreated = async(node: Tree<string, string>, path: TreePath) => {
				if(isTreeLeaf(node)){
					const pathStr = treePathToString(forest, path.slice(0, -1), node.value)
					const item = createItem(props)
					setMap(map => ({...map, [pathStr]: item}))
				}
				setForest(forest => addTreeByPath(forest, node, path))
			}

			const onNodeMoved = async(node: Tree<string, string>, fromPath: TreePath, toPath: TreePath) => {
				const oldPath = treePathToString(forest, fromPath, undefined, isTreeBranch(node) ? "branch" : "leaf")
				const newPath = treePathToString(forest, toPath.slice(0, -1), node.value, isTreeBranch(node) ? "branch" : "leaf")
				updateMapByPrefix(oldPath, newPath)
				setForest(forest => moveTreeByPath(forest, fromPath, toPath))
			}

			const onNodeRenamed = async(node: Tree<string, string>, path: TreePath, newName: string) => {
				const oldPath = treePathToString(forest, path, undefined, isTreeBranch(node) ? "branch" : "leaf")
				const newPath = treePathToString(forest, path.slice(0, -1), newName, isTreeBranch(node) ? "branch" : "leaf")
				updateMapByPrefix(oldPath, newPath)
				setForest(forest => updateTreeByPath(forest, path, tree => ({...tree, value: newName})))
			}

			const onNodeDeleted = async(node: Tree<string, string>, path: TreePath) => {
				if(isTreeLeaf(node)){
					const pathStr = treePathToString(forest, path)
					setMap(map => {
						const newMap = {...map}
						delete newMap[pathStr]
						return newMap
					})
				}
				setForest(forest => deleteFromTreeByPath(forest, path))
			}

			return (
				<UnsavedChanges isUnsaved={isUnsaved} saveOnUnmount save={save}>
					<Component
						{...props}
						forest={forest}
						setForest={setForest}
						onNodeCreated={onNodeCreated}
						onNodeDeleted={onNodeDeleted}
						onNodeMoved={onNodeMoved}
						onNodeRenamed={onNodeRenamed}
					/>
				</UnsavedChanges>
			)
		}
	}
}

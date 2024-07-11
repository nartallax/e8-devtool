import {UnsavedChanges} from "client/components/unsaved_changes_context/unsaved_changes_context"
import {useSaveableState} from "client/components/unsaved_changes_context/use_saveable_state"
import {ProjectObjectReferrer} from "client/parts/data_providers/data_resolvers"
import {useProject} from "client/parts/project_context"
import {SetState} from "client/ui_utils/react_types"
import {Tree, TreePath, addTreeByPath, deleteFromTreeByPath, isTreeBranch, isTreeLeaf, moveTreeByPath, updateTreeByPath} from "common/tree"
import {UUID} from "crypto"
import {Project} from "data/project"
import {treePathToString} from "data/project_utils"
import {useCallback, useEffect, useMemo, useState} from "react"

type ChangesProps = Pick<React.ComponentProps<typeof UnsavedChanges>, "saveOnUnmount" | "save" | "isUnsaved">

type EditableForest = {
	forestProps: {
		forest: Tree<string, string>[]
		createNode: (node: Tree<string, string>, path: TreePath) => Promise<void>
		moveNode: (node: Tree<string, string>, fromPath: TreePath, toPath: TreePath) => Promise<void>
		renameNode: (node: Tree<string, string>, path: TreePath, newName: string) => Promise<void>
		deleteNode: (node: Tree<string, string>, path: TreePath) => Promise<void>
	}
	changesProps: ChangesProps
}

type EditableItem<T> = {
	value: T
	setValue: SetState<T>
	changesProps: ChangesProps
}

type ForestDataFetchers<T> = {
	getByPath: ((path: string) => Promise<T>) & ((path: null) => Promise<null>)
	getPathById: ((id: UUID) => Promise<string>) & ((id: null) => Promise<null>)
	getAsMap: () => Promise<Map<string, T>>
	getReferrers: (fieldName: keyof T, value: unknown) => Promise<ProjectObjectReferrer[]>
}

type ForestDataProvider<T> = ForestFetcherHooks<T> & {
	useEditableForest: (createItem: () => T) => EditableForest
	useEditableItem: (id: UUID) => EditableItem<T>
	useFetchers: () => ForestDataFetchers<T>
}

type ForestFetcherHooks<T> = {
	useByPath: ((path: string) => T | null) & ((path: null) => null)
	usePathById: ((id: UUID) => string | null) & ((id: null) => null)
	useAsMap: () => Map<string, T>
}

type ForestMapProps = {
	mapName: keyof Project
	forestName: keyof Project
	itemType: ProjectObjectReferrer["type"]
}

function makeFetchers<T extends {id: UUID}>(project: Project, mapPropName: keyof Project, itemType: ProjectObjectReferrer["type"]): ForestDataFetchers<T> {
	const map = project[mapPropName] as Record<string, T>

	function getByPath(path: null): Promise<null>
	function getByPath(path: string): Promise<T>
	async function getByPath(path: string | null): Promise<T | null> {
		if(path === null){
			return null
		}
		const item = map[path]
		if(!item){
			throw new Error("Unknown item path: " + path)
		}
		return item
	}

	function getPathById(id: null): Promise<null>
	function getPathById(id: UUID): Promise<string>
	async function getPathById(id: UUID | null): Promise<string | null> {
		if(id === null){
			return null
		}
		for(const path in map){
			const item = map[path]!
			if(item.id === id){
				return path
			}
		}
		throw new Error("Unknown item id: " + id)
	}

	const getAsMap = async() => new Map(Object.entries(map))

	const getReferrers = async(fieldName: keyof T, value: unknown) => {
		const result: ProjectObjectReferrer[] = []
		for(const path in map){
			const item = map[path]!
			if(item[fieldName] === value){
				result.push({path, type: itemType})
			}
		}
		return result
	}

	return {
		getByPath, getPathById, getAsMap, getReferrers
	}
}

function makeForestFetcherHooks<T>(mapPropName: keyof Project, itemType: ProjectObjectReferrer["type"]): ForestFetcherHooks<T> {
	function useFetcher<I, O>(dflt: O, input: I, fetcherName: keyof ForestDataFetchers<unknown>): O {
		// this is a bit scuffed, because we here are alright on re-fetching each project change
		// it's a weird thing to do with API, but then we won't have project as mutable dependency
		// but then we'll have a problem with non-updating data
		// and we'll need to have a system of update propagation
		// two ways it could be done:
		// 1. locally - every time something modifies data, it increments a state, which causes all related hooks to refetch
		// 2. globally - client holds websocket connection to the server, and each time something modifies the data, server notifies subscribers
		// ...which increments a state and causes hooks to refetch
		const [project] = useProject()
		const fetcher = useMemo(() =>
			makeFetchers(project, mapPropName, itemType)[fetcherName] as unknown as (input: I) => Promise<O>
		, [project, fetcherName]
		)
		const [result, setResult] = useState(dflt)
		useEffect(() => {
			void fetcher(input).then(res => setResult(res))
		}, [fetcher, input])
		return result
	}

	const useByPath = (path: string | null) => useFetcher(null, path, "getByPath")
	const usePathById = (id: UUID | null) => useFetcher(null, id, "getPathById")
	const useAsMap = () => useFetcher(new Map(), null, "getAsMap")
	return {useAsMap, usePathById, useByPath}
}

function makeUseEditableForest<T>({
	forestName: forestPropName, mapName: mapPropName
}: ForestMapProps) {
	return function useEditableForest(createItem: () => T): EditableForest {
		const [project, setProject] = useProject()
		const {
			isUnsaved, setState: setMapForest, save, state: {map, forest}
		} = useSaveableState({
			map: project[mapPropName] as Record<string, T>,
			forest: project[forestPropName] as Tree<string, string>[]
		}, ({map, forest}) => setProject(project => ({
			...project,
			[mapPropName]: map,
			[forestPropName]: forest
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

		const createNode = async(node: Tree<string, string>, path: TreePath) => {
			if(isTreeLeaf(node)){
				const pathStr = treePathToString(forest, path.slice(0, -1), node.value)
				const item = createItem()
				setMap(map => ({...map, [pathStr]: item}))
			}
			setForest(forest => addTreeByPath(forest, node, path))
		}

		const moveNode = async(node: Tree<string, string>, fromPath: TreePath, toPath: TreePath) => {
			const oldPath = treePathToString(forest, fromPath, undefined, isTreeBranch(node) ? "branch" : "leaf")
			const newPath = treePathToString(forest, toPath.slice(0, -1), node.value, isTreeBranch(node) ? "branch" : "leaf")
			updateMapByPrefix(oldPath, newPath)
			setForest(forest => moveTreeByPath(forest, fromPath, toPath))
		}

		const renameNode = async(node: Tree<string, string>, path: TreePath, newName: string) => {
			const oldPath = treePathToString(forest, path, undefined, isTreeBranch(node) ? "branch" : "leaf")
			const newPath = treePathToString(forest, path.slice(0, -1), newName, isTreeBranch(node) ? "branch" : "leaf")
			updateMapByPrefix(oldPath, newPath)
			setForest(forest => updateTreeByPath(forest, path, tree => ({...tree, value: newName})))
		}

		const deleteNode = async(node: Tree<string, string>, path: TreePath) => {
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

		return {
			forestProps: {
				createNode, moveNode, renameNode, deleteNode, forest
			},
			changesProps: {isUnsaved, save, saveOnUnmount: true}
		}
	}
}

function makeUseEditableItem<T extends {id: UUID}>(mapPropName: keyof Project) {
	return function useEditableItem(id: UUID): EditableItem<T> {
		const [project, setProject] = useProject()

		const _valuePair = Object.entries(project[mapPropName] as Record<string, T>).find(([, item]) => item.id === id)
		if(!_valuePair){
			throw new Error("No item found by id = " + id)
		}
		const [path, _value] = _valuePair

		const {
			isUnsaved, setState: setValue, save, state: value
		} = useSaveableState(_value, value => setProject(project => ({
			...project,
			[mapPropName]: {...project[mapPropName] as Record<string, T>, [path]: value}
		})))

		return {
			value, setValue,
			changesProps: {save, isUnsaved, saveOnUnmount: true}
		}
	}
}

function makeUseFetchers<T extends {id: UUID}>(mapPropName: keyof Project, itemType: ProjectObjectReferrer["type"]): () => ForestDataFetchers<T> {
	return function useFetchers() {
		const [project] = useProject()
		return useMemo(() => makeFetchers<T>(project, mapPropName, itemType), [project])
	}
}

export function makeProjectForestDataProvider<T extends {id: UUID}>({mapName: mapPropName, forestName: forestPropName, itemType}: ForestMapProps): ForestDataProvider<T> {
	return {
		...makeForestFetcherHooks(mapPropName, itemType),
		useFetchers: makeUseFetchers(mapPropName, itemType),
		useEditableForest: makeUseEditableForest({mapName: mapPropName, forestName: forestPropName, itemType}),
		useEditableItem: makeUseEditableItem(mapPropName)
	}
}
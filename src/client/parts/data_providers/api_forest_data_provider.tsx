import {Forest, ForestPath, Tree, isTreeBranch} from "@nartallax/forest"
import {useAlert} from "client/components/modal/alert_modal"
import {UnsavedChanges} from "client/components/unsaved_changes_context/unsaved_changes_context"
import {useWrapSaveableState} from "client/components/unsaved_changes_context/use_saveable_state"
import {DevtoolApiClient, ForestApiBindings, useApiClient, useAsyncCall} from "client/parts/api_context"
import {ProjectObjectReferrer, ProjectObjectType} from "client/parts/data_providers/project_referrers"
import {AbortError} from "client/ui_utils/abort_error"
import {makeQueryGroup} from "client/ui_utils/cacheable_query"
import {SetState} from "client/ui_utils/react_types"
import {UUID} from "common/uuid"
import {mergePath, treePathToString} from "data/project_utils"
import {useCallback} from "react"

type ChangesProps = Pick<React.ComponentProps<typeof UnsavedChanges>, "saveOnUnmount" | "save" | "isUnsaved">

type EditableForest = {
	trees: readonly Tree<string, string>[]
	createNode: (node: Tree<string, string>, path: ForestPath) => Promise<void>
	moveNode: (node: Tree<string, string>, fromPath: ForestPath, toPath: ForestPath) => Promise<void>
	renameNode: (node: Tree<string, string>, path: ForestPath, newName: string) => Promise<void>
	deleteNode: (node: Tree<string, string>, path: ForestPath) => Promise<void>
	makePath: (parts: string[], isPrefix: boolean) => string
}

type EditableItem<T> = {
	value: T
	setValue: SetState<T>
	saveUnsaved: () => Promise<void>
	changesProps: ChangesProps
}

type ForestDataFetchers<T> = {
	getByPath: ((path: string) => Promise<T>) & ((path: null) => Promise<null>)
	getPathById: ((id: UUID) => Promise<string>) & ((id: null) => Promise<null>)
	getAsMap: () => Promise<Map<string, T>>
	getReferrers: <K extends keyof T>(fieldName: K, value: T[K]) => Promise<ProjectObjectReferrer[]>
	getForest: () => Promise<Tree<string, string>[]>
	create: (path: string, index: number, item: T) => Promise<void>
}

type EditableForestProps<T> = {
	createItem: () => T
}

export type ForestDataProvider<T> = ForestFetcherHooks<T> & {
	useEditableForest: (props: EditableForestProps<T>) => EditableForest | null
	useEditableItem: (id: UUID) => EditableItem<T> | null
	useEditableItemByPath: (path: string) => EditableItem<T> | null
	useFetchers: () => ForestDataFetchers<T>
}

type ForestFetcherHooks<T> = {
	useByPath: ((path: string) => T | null) & ((path: null) => null)
	usePathById: ((id: UUID | null) => string | null) & ((id: null) => null)
	useAsMap: () => Map<string, T> | null
}

const noopReferers = () => []

export function makeApiForestDataProvider<T>(itemType: ProjectObjectType, bindingsName: keyof DevtoolApiClient["forestBindings"], useReferrerFetcher: () => (item: T) => Promise<ProjectObjectReferrer[]>[] = () => noopReferers): ForestDataProvider<T> {
	const useQueries = () => {
		const apiClient = useApiClient()
		const bindings = apiClient.forestBindings[bindingsName] as unknown as ForestApiBindings<T>
		return makeQueryGroup([bindingsName], ({query, mutation}) => {
			return {
				create: mutation(bindings.create),
				update: mutation(bindings.update),
				createDirectory: mutation(bindings.createDirectory),
				move: mutation(bindings.move),
				rename: mutation(bindings.rename),
				delete: mutation(bindings.delete),
				getForest: query(bindings.getForest),
				getReferrers: query(async <K extends keyof T>(field: K, value: T[K]) => {
					const paths = await bindings.getPathsByFieldValue(field, value)
					return paths.map(path => ({path, type: itemType}))
				}),
				getAsMap: query(async() => {
					const record = await bindings.getAll()
					return new Map(Object.entries(record))
				}),
				getPathById: query(async(id: UUID | null) => {
					if(id === null){
						return null
					}
					return await bindings.getPathById(id)
				}),
				get: query(bindings.get),
				getByPath: query(async(path: string) => {
					if(path === null){
						return null
					}
					return await bindings.getByPath(path)
				})
			}
		})
	}

	type Queries = ReturnType<typeof useQueries>

	function useEditableForest({createItem}: EditableForestProps<T>): EditableForest | null {
		const queries = useQueries()
		const [forest, setForest, {isLoaded}] = useAsyncCall<readonly Tree<string, string>[]>(
			[],
			() => queries.getForest.getValue(),
			[]
		)
		const getReferrers = useReferrerFetcher()

		const {showAlert} = useAlert()

		if(!isLoaded){
			return null
		}

		const showRefErrors = async(refs: ProjectObjectReferrer[]) => {
			if(refs.length === 0){
				return
			}

			const firstRefs = refs.slice(0, 10)
			let message = `This ${itemType} is being referred to from other objects: `
			message += "\n\t" + firstRefs.map(({type, path}) => `${type}: ${path}`).join("\n\t")
			if(firstRefs.length < refs.length){
				message += `\n...and ${refs.length - firstRefs.length} more.`
			}
			message += `\nYou should remove those references first, and then delete this ${itemType}.`

			await showAlert({header: `This ${itemType} is in use`, body: message})
			throw new AbortError(`Deletion prevented, ${itemType} is used from ${refs.length} objects.`)
		}

		const createNode = async(node: Tree<string, string>, path: ForestPath) => {
			const pathStr = treePathToString(forest, path.slice(0, -1), node.value)
			if(!isTreeBranch(node)){
				const item = createItem()
				await queries.create(pathStr, path[path.length - 1]!, item)
			} else {
				await queries.createDirectory(pathStr, path[path.length - 1]!)
			}
			setForest(forest => new Forest(forest).insertTreeAt(path, node).trees)
		}

		const moveNode = async(node: Tree<string, string>, fromPath: ForestPath, toPath: ForestPath) => {
			await queries.move(
				treePathToString(forest, fromPath),
				treePathToString(forest, toPath.slice(0, -1), node.value),
				toPath[toPath.length - 1]!
			)
			setForest(forest => new Forest(forest).move(fromPath, toPath).trees)
		}

		const renameNode = async(node: Tree<string, string>, path: ForestPath, newName: string) => {
			void node // we don't actually need node here, it's here for sake of regularity of handler arguments
			await queries.rename(treePathToString(forest, path), newName)
			setForest(forest => new Forest(forest).updateTreeAt(path, tree => ({...tree, value: newName})).trees)
		}

		const deleteNode = async(node: Tree<string, string>, path: ForestPath) => {
			const pathStr = treePathToString(forest, path)
			if(!isTreeBranch(node)){
				if(getReferrers !== noopReferers){
					const item = await queries.getByPath.getValue(pathStr)
					const refs = (await Promise.all(getReferrers(item!))).flat()
					await showRefErrors(refs)
				}
			}
			await queries.delete(pathStr)
			setForest(forest => new Forest(forest).deleteAt(path).trees)
		}

		return {
			createNode, moveNode, renameNode, deleteNode, trees: forest, makePath: mergePath
		}
	}

	const useEditableItemByFetcher = (fetcher: (queries: Queries) => Promise<T>) => {
		const queries = useQueries()
		const [rawValue, rawSetValue] = useAsyncCall(() => fetcher(queries), [fetcher])
		const {
			state, setState, saveIfUnsaved, isUnsaved
		} = useWrapSaveableState(rawValue, rawSetValue, async value => {
			await queries.update(value!)
		})

		if(!state){
			return null
		}

		return {
			value: state!,
			setValue: setState as SetState<T>,
			saveUnsaved: saveIfUnsaved,
			changesProps: {
				isUnsaved, save: saveIfUnsaved
			}
		}
	}

	return {
		useAsMap: () => useQueries().getAsMap.useValue(),
		usePathById: ((id: UUID | null) => useQueries().getPathById.useValue(id)) as ForestDataProvider<T>["usePathById"],
		useByPath: ((path: string) => useQueries().getByPath.useValue(path)) as ForestDataProvider<T>["useByPath"],

		useFetchers: () => {
			const queries = useQueries()
			return {
				getAsMap: queries.getAsMap.getValue,
				getByPath: queries.getByPath.getValue as ForestDataFetchers<T>["getByPath"],
				getPathById: queries.getPathById.getValue as ForestDataFetchers<T>["getPathById"],
				getReferrers: queries.getReferrers.getValue,
				create: queries.create,
				getForest: queries.getForest.getValue
			}
		},

		useEditableItem: (id: UUID) => {
			const fetcher = useCallback(async(queries: Queries) => await queries.get.getValue(id), [id])
			return useEditableItemByFetcher(fetcher)
		},

		useEditableItemByPath: (path: string) => {
			const fetcher = useCallback(async(queries: Queries) => (await queries.getByPath.getValue(path))!, [path])
			return useEditableItemByFetcher(fetcher)
		},

		useEditableForest
	}
}
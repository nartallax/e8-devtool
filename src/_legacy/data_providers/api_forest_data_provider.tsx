import {Forest, ForestPath, Tree, isTreeBranch} from "@nartallax/forest"
import {useAlert} from "client/components/modal/alert_modal"
import {UnsavedChanges} from "client/components/unsaved_changes_context/unsaved_changes_context"
import {useWrapSaveableState} from "client/components/unsaved_changes_context/use_saveable_state"
import {DevtoolApiClient, ForestApiBindings, useApiClient, useAsyncCall} from "client/parts/api_context"
import {ProjectObjectReferrer, ProjectObjectType} from "client/parts/data_providers/project_referrers"
import {AbortError} from "client/ui_utils/abort_error"
import {makeQueryGroup} from "client/ui_utils/cacheable_query"
import {SetState} from "client/ui_utils/react_types"
import {mergePath, replaceLastPathPart, treePathToString} from "data/project_utils"
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
	get: ((path: string) => Promise<T>) & ((path: null) => Promise<null>)
	getForest: () => Promise<Tree<string, string>[]>
	create: (path: string, item: T) => Promise<void>
}

type EditableForestProps<T> = {
	createItem: () => T
}

export type ForestDataProvider<T> = {
	useByPath: ((path: string) => T | null) & ((path: null) => null)
	useEditableForest: (props: EditableForestProps<T>) => EditableForest | null
	useEditableItem: (path: string) => EditableItem<T> | null
	useFetchers: () => ForestDataFetchers<T>
}

const noopReferers = () => []

export function makeApiForestDataProvider<T>(
	itemType: ProjectObjectType,
	bindingsName: keyof DevtoolApiClient["forestBindings"],
	useReferrerFetcher: () => (item: T) => Promise<ProjectObjectReferrer[]>[] = () => noopReferers
): ForestDataProvider<T> {

	const useQueries = () => {
		const apiClient = useApiClient()
		const bindings = apiClient.forestBindings[bindingsName] as unknown as ForestApiBindings<T>
		return makeQueryGroup([bindingsName], ({query, mutation}) => {
			return {
				create: mutation(bindings.create),
				update: mutation(bindings.update),
				createDirectory: mutation(bindings.createDirectory),
				move: mutation(bindings.move),
				delete: mutation(bindings.delete),
				getForest: query(bindings.getForest),
				get: query(bindings.get)
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
				await queries.create(pathStr, item)
			} else {
				await queries.createDirectory(pathStr)
			}
			setForest(forest => new Forest(forest).insertTreeAt(path, node).trees)
		}

		const moveNode = async(node: Tree<string, string>, fromPath: ForestPath, toPath: ForestPath) => {
			await queries.move(
				treePathToString(forest, fromPath),
				treePathToString(forest, toPath.slice(0, -1), node.value)
			)
			setForest(forest => new Forest(forest).move(fromPath, toPath).trees)
		}

		const renameNode = async(node: Tree<string, string>, path: ForestPath, newName: string) => {
			void node // we don't actually need node here, it's here for sake of regularity of handler arguments
			const oldPath = treePathToString(forest, path)
			const newPath = replaceLastPathPart(oldPath, newName)
			await queries.move(oldPath, newPath)
			setForest(forest => new Forest(forest).updateTreeAt(path, tree => ({...tree, value: newName})).trees)
		}

		const deleteNode = async(node: Tree<string, string>, path: ForestPath) => {
			const pathStr = treePathToString(forest, path)
			if(!isTreeBranch(node)){
				if(getReferrers !== noopReferers){
					const item = await queries.get.getValue(pathStr)
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

	const useEditableItemByFetcher = (path: string, fetcher: (queries: Queries) => Promise<T>) => {
		const queries = useQueries()
		const [rawValue, rawSetValue] = useAsyncCall(() => fetcher(queries), [fetcher])
		const {
			state, setState, saveIfUnsaved, isUnsaved
		} = useWrapSaveableState(rawValue, rawSetValue, async value => {
			await queries.update(path, value!)
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
		useByPath: ((path: string) => useQueries().get.useValue(path)) as ForestDataProvider<T>["useByPath"],

		useFetchers: () => {
			const queries = useQueries()
			return {
				get: queries.get.getValue as ForestDataFetchers<T>["get"],
				create: queries.create,
				getForest: queries.getForest.getValue
			}
		},

		useEditableItem: (path: string) => {
			const fetcher = useCallback(async(queries: Queries) => (await queries.get.getValue(path))!, [path])
			return useEditableItemByFetcher(path, fetcher)
		},

		useEditableForest
	}
}
import {Project, ProjectInputBind, ProjectModel} from "data/project"
import {sortBy} from "common/sort_by"
import {Tree, TreePath, allTreeNodes, getForestLeaves, isTreeBranch, treePathToValues} from "common/tree"
import {UUID} from "common/uuid"

// only this function should be used to get all project modals
// because it will guarantee that the order is the same each time
// and order is important, because index of the model is its id
/** @returns [all folder labels, in descendance order; model] */
export function getAllProjectModelsWithFolders(project: Project): [string[], ProjectModel][] {
	const allModels: [string[], ProjectModel][] = [...modelsWithPaths(project)]
	sortBy(allModels, x => x[1].id)
	return allModels
}

export function getAllProjectModels(project: Project): ProjectModel[] {
	return getAllProjectModelsWithFolders(project).map(x => x[1])
}

export function getSortedProjectBinds(project: Project): [ProjectInputBind, string[]][] {
	const arr = mappedForestToArrayWithPath(project.inputBindTree, project.inputBinds)
	sortBy(arr, ([bind]) => bind.id)
	return arr
}

export function mergePath(parts: string[], isPrefix?: boolean): string {
	let result = parts.join("/")
	if(isPrefix){
		result += "/"
	}
	return result
}

export function splitPath(path: string): string[] {
	if(path.endsWith("/")){
		path = path.substring(0, path.length - 1)
	}
	return path.split("/")
}

export function getLastPathPart(path: string): string {
	const parts = splitPath(path)
	return parts[parts.length - 1]!
}

export function treePathToString(forest: Tree<string, string>[], path: TreePath, addedPart?: string, type?: "leaf" | "branch"): string {
	const parts = treePathToValues(forest, path)
	if(addedPart){
		parts.push(addedPart)
	}

	return mergePath(parts, type === "branch")
}

export const pathById = (forest: Tree<string, string>[], map: Record<string, {id: UUID}>, id: UUID): TreePath => {
	for(const [branches, leaf, path] of getForestLeaves(forest)){
		const pathParts = branches.map(x => x.value)
		pathParts.push(leaf)
		const pathStr = mergePath(pathParts)
		const value = map[pathStr]!
		if(value.id === id){
			return path
		}
	}
	throw new Error(`Object with id = ${id} not found`)
}

export const pathStrById = (forest: Tree<string, string>[], map: Record<string, {id: UUID}>, id: UUID): string => {
	for(const [branches, leaf] of getForestLeaves(forest)){
		const pathParts = branches.map(x => x.value)
		pathParts.push(leaf)
		const path = mergePath(pathParts)
		const value = map[path]!
		if(value.id === id){
			return path
		}
	}
	throw new Error(`Object with id = ${id} not found`)
}

export function* modelsWithPaths(project: Project): IterableIterator<[string[], ProjectModel]> {
	for(const [branches, leaf] of getForestLeaves(project.modelTree)){
		const fullPath = branches.map(x => x.value)
		fullPath.push(leaf)
		const pathStr = mergePath(fullPath)
		const model = project.models[pathStr]
		if(!model){
			throw new Error("No model for path " + pathStr)
		}
		yield[fullPath, model]
	}
}

export function namesOfModelsWhich(project: Project, predicate: (model: ProjectModel) => boolean): string[] {
	const names: string[] = []
	for(const [path, model] of modelsWithPaths(project)){
		if(predicate(model)){
			names.push(path[path.length - 1]!)
		}
	}
	return names
}

export const mappedForestToNameMap = (forest: Tree<string, string>[], map: Record<string, {id: UUID}>): Map<UUID, string> => {
	const result = new Map<UUID, string>()
	for(const [branches, leaf] of getForestLeaves(forest)){
		const fullPath = branches.map(x => x.value)
		fullPath.push(leaf)
		const pathStr = mergePath(fullPath)
		const item = map[pathStr]
		if(!item){
			throw new Error("No item for path " + pathStr)
		}
		result.set(item.id, leaf)
	}
	return result
}

export const forestToNameMap = (forest: Tree<string, string>[]): Map<string, string> => {
	const result = new Map<string, string>()
	for(const [branches, leaf] of getForestLeaves(forest)){
		const fullPath = branches.map(x => x.value)
		fullPath.push(leaf)
		const pathStr = mergePath(fullPath)
		result.set(pathStr, leaf)
	}
	return result
}

export const mappedForestToArray = <T>(forest: Tree<string, string>[], map: Record<string, T>): T[] => {
	const result: T[] = []
	for(const [branches, leaf] of getForestLeaves(forest)){
		const fullPath = branches.map(x => x.value)
		fullPath.push(leaf)
		const pathStr = mergePath(fullPath)
		const item = map[pathStr]
		if(item){
			result.push(item)
		}
	}
	return result
}

export const mappedForestToArrayWithPath = <T>(forest: Tree<string, string>[], map: Record<string, T>): [T, string[]][] => {
	const result: [T, string[]][] = []
	for(const [branches, leaf] of getForestLeaves(forest)){
		const fullPath = branches.map(x => x.value)
		fullPath.push(leaf)
		const pathStr = mergePath(fullPath)
		const item = map[pathStr]
		if(item){
			result.push([item, fullPath])
		}
	}
	return result
}

export const getForestPaths = (forest: Tree<string, string>[], includeBranches?: boolean): [string, string[]][] => {
	const result: [string, string[]][] = []
	if(!includeBranches){
		for(const [branches, leaf] of getForestLeaves(forest)){
			const fullPath = branches.map(x => x.value)
			fullPath.push(leaf)
			const pathStr = mergePath(fullPath)
			result.push([pathStr, fullPath])
		}
	} else {
		for(const nodes of allTreeNodes(forest)){
			const fullPath = nodes.map(x => x.value)
			const pathStr = mergePath(fullPath, isTreeBranch(nodes[nodes.length - 1]!))
			result.push([pathStr, fullPath])
		}
	}
	return result
}
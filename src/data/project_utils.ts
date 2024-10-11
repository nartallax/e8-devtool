import {ProjectInputBind, ProjectModel} from "data/project"
import {sortBy} from "common/sort_by"
import {UUID} from "common/uuid"
import {Forest, ForestPath, Tree} from "@nartallax/forest"
import {isTreeBranch} from "common/tree"

// only this function should be used to get all project modals
// because it will guarantee that the order is the same each time
// and order is important, because index of the model is its id
/** @returns [all folder labels, in descendance order; model] */
export function getAllProjectModelsWithFolders(forest: readonly Tree<string, string>[], map: Record<string, ProjectModel>): [string[], ProjectModel][] {
	const allModels: [string[], ProjectModel][] = [...modelsWithPaths(forest, map)]
	sortBy(allModels, x => x[1].id)
	return allModels
}

export function getAllProjectModels(forest: readonly Tree<string, string>[], map: Record<string, ProjectModel>): ProjectModel[] {
	return getAllProjectModelsWithFolders(forest, map).map(x => x[1])
}

export function getSortedProjectBinds(forest: readonly Tree<string, string>[], map: Record<string, ProjectInputBind>): [ProjectInputBind, string[]][] {
	const arr = mappedForestToArrayWithPath(forest, map)
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

export function dropLastPathPart(path: string): string {
	const parts = splitPath(path)
	return parts.slice(0, -1).join("/")
}

export function replaceLastPathPart(path: string, name: string): string {
	const parts = splitPath(path).slice(0, -1)
	parts.push(name)
	return parts.join("/")
}

export function treePathToString(forest: readonly Tree<string, string>[], path: ForestPath, addedPart?: string, type?: "leaf" | "branch"): string {
	const parts = new Forest(forest).pathToValues(path)
	if(addedPart){
		parts.push(addedPart)
	}

	return mergePath(parts, type === "branch")
}

export const pathById = (trees: Tree<string, string>[], map: Record<string, {id: UUID}>, id: UUID): ForestPath => {
	const forest = new Forest(trees)
	for(const [, path] of forest.getLeavesWithPaths()){
		const pathParts = forest.pathToValues(path)
		const pathStr = mergePath(pathParts)
		const value = map[pathStr]!
		if(value.id === id){
			return path
		}
	}
	throw new Error(`Object with id = ${id} not found`)
}

export const pathStrById = (trees: Tree<string, string>[], map: Record<string, {id: UUID}>, id: UUID): string => {
	const forest = new Forest(trees)
	for(const [, path] of forest.getLeavesWithPaths()){
		const pathParts = forest.pathToValues(path)
		const pathStr = mergePath(pathParts)
		const value = map[pathStr]!
		if(value.id === id){
			return pathStr
		}
	}
	throw new Error(`Object with id = ${id} not found`)
}

export function* modelsWithPaths(trees: readonly Tree<string, string>[], map: Record<string, ProjectModel>): IterableIterator<[string[], ProjectModel]> {
	const forest = new Forest(trees)
	for(const [, path] of forest.getLeavesWithPaths()){
		const fullPath = forest.pathToValues(path)
		const pathStr = mergePath(fullPath)
		const model = map[pathStr]
		if(!model){
			throw new Error("No model for path " + pathStr)
		}
		yield[fullPath, model]
	}
}

// TODO: most of functions in this file should become outdated after converting to API

export const mappedForestToArray = <T>(trees: Tree<string, string>[], map: Record<string, T>): T[] => {
	const forest = new Forest(trees)
	const result: T[] = []
	for(const [, path] of forest.getLeavesWithPaths()){
		const fullPath = forest.pathToValues(path)
		const pathStr = mergePath(fullPath)
		const item = map[pathStr]
		if(item){
			result.push(item)
		}
	}
	return result
}

export const mappedForestToArrayWithPath = <T>(trees: readonly Tree<string, string>[], map: Record<string, T>): [T, string[]][] => {
	const forest = new Forest(trees)
	const result: [T, string[]][] = []
	for(const [, path] of forest.getLeavesWithPaths()){
		const fullPath = forest.pathToValues(path)
		const pathStr = mergePath(fullPath)
		const item = map[pathStr]
		if(item){
			result.push([item, fullPath])
		}
	}
	return result
}

export const getForestPaths = (trees: readonly Tree<string, string>[], includeBranches?: boolean): [string, string[]][] => {
	const forest = new Forest(trees)
	const result: [string, string[]][] = []
	if(!includeBranches){
		for(const [, path] of forest.getLeavesWithPaths()){
			const fullPath = forest.pathToValues(path)
			const pathStr = mergePath(fullPath)
			result.push([pathStr, fullPath])
		}
	} else {
		for(const [tree, path] of forest.getAllTrees()){
			const fullPath = forest.pathToValues(path)
			const pathStr = mergePath(fullPath, isTreeBranch(tree))
			result.push([pathStr, fullPath])
		}
	}
	return result
}
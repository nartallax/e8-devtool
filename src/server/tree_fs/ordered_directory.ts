import {Forest, ForestPath, Tree, isTreeBranch} from "@nartallax/forest"
import {ApiError} from "common/api_response"
import {directoryExists} from "common/file_exists"
import {pathPartRegexp} from "common/regexps"
import {dropLastPathPart, splitPath} from "data/project_utils"
import {promises as Fs} from "fs"
import * as Path from "path"

const orderingFileName = "tree.e8.json"
enum OrderingFlags {
	isBranch = 1 << 0
}

type OrderingEntry = [name: string, flags?: number]
type Ordering = OrderingEntry[]

/** A wrapper around a filesystem directory that allows to transform it into string tree, and back.
Trees are ordered; ordering is stored in a special files inside each directory.
Caches forest representation of the directory */
export class OrderedDirectory {
	constructor(readonly path: string, public forest: readonly Tree<string, string>[]) {}

	static async createAt(path: string): Promise<OrderedDirectory> {
		return new OrderedDirectory(path, await this.getInitialForest(path))
	}

	static async getInitialForest(path: string): Promise<readonly Tree<string, string>[]> {
		if(!(await directoryExists(path))){
			await createOrderedDirectoryAt(path, true)
			return []
		} else {
			return await readOrderedDirectoryRecursive(path)
		}
	}

	private relPathToTreePath(relPath: string): ForestPath {
		const path = new Forest(this.forest).valuesToPath(relPath.split(/[/\\]/g).filter(x => !!x))
		if(!path){
			throw new Error("Path not found in tree: " + relPath)
		}
		return path
	}

	private newRelPathToTreePath(relPath: string, index: number): ForestPath {
		return [...this.relPathToTreePath(dropLastPathPart(relPath)), index]
	}

	private validatePath(relPathOrPart: string): void {
		for(const pathPart of splitPath(relPathOrPart)){
			if(!pathPartRegexp.test(pathPart)){
				throw new ApiError(`Name "${pathPart}" is not a valid path part.`)
			}
		}
	}

	async createNode(relPath: string, index: number, isBranch: boolean): Promise<string> {
		this.validatePath(relPath)
		const fullPath = Path.resolve(this.path, relPath)
		// all those FS operation could use some rollback strategy, in case one of them goes wrong and the rest don't
		const [, [entryName]] = await Promise.all([
			createOrderedDirectoryAt(fullPath, isBranch),
			insertOrderingEntry(Path.dirname(fullPath), Path.basename(fullPath), isBranch, index)
		])

		let tree: Tree<string, string> = {value: entryName}
		if(isBranch){
			tree = {...tree, children: []}
		}
		this.forest = new Forest(this.forest).insertTreeAt(this.newRelPathToTreePath(relPath, index), tree).trees
		return fullPath
	}

	async deleteNode(relPath: string, onLeafDeleted?: (relPath: string) => void): Promise<void> {
		this.validatePath(relPath)
		const fullPath = Path.resolve(this.path, relPath)
		await Promise.all([
			Fs.rm(fullPath, {recursive: true}),
			deleteOrderingEntry(Path.dirname(fullPath), Path.basename(fullPath))
		])

		if(onLeafDeleted){
			const deletedTreePath = this.relPathToTreePath(relPath)
			const tree = new Forest(this.forest).getTreeAt(deletedTreePath)
			if(isTreeBranch(tree)){
				for(const [,treePath] of new Forest(tree.children).getLeavesWithPaths()){
					const fullLeafPath = [...deletedTreePath, ...treePath]
					const leafRelPath = new Forest(this.forest).pathToValues(fullLeafPath).join("/")
					onLeafDeleted(leafRelPath)
				}
			} else {
				onLeafDeleted(relPath)
			}
		}

		this.forest = new Forest(this.forest).deleteAt(this.relPathToTreePath(relPath)).trees
	}

	async moveNode(fromRelPath: string, toRelPath: string, index: number, onLeafMoved?: (oldRelPath: string, newRelPath: string) => void): Promise<string> {
		this.validatePath(fromRelPath)
		this.validatePath(toRelPath)
		const fromFullPath = Path.resolve(this.path, fromRelPath)
		const toFullPath = Path.resolve(this.path, toRelPath)
		const [, [, flags]] = await Promise.all([
			Fs.rename(fromFullPath, toFullPath),
			deleteOrderingEntry(Path.dirname(fromFullPath), Path.basename(fromFullPath))
		])
		await insertOrderingEntry(Path.dirname(toFullPath), Path.basename(toFullPath), ((flags ?? 0) & OrderingFlags.isBranch) !== 0, index)

		const oldTreePath = this.relPathToTreePath(fromRelPath)
		const newTreePath = this.newRelPathToTreePath(toRelPath, index)

		if(onLeafMoved){
			const rootForest = new Forest(this.forest)
			const tree = rootForest.getTreeAt(oldTreePath)
			if(isTreeBranch(tree)){
				for(const [,treePath] of new Forest(tree.children).getLeavesWithPaths()){
					const fullLeafPath = [...oldTreePath, ...treePath]
					const oldRelPath = rootForest.pathToValues(fullLeafPath).join("/")
					const newRelPath = rootForest.pathToValues(fullLeafPath).join("/")
					onLeafMoved(oldRelPath, newRelPath)
				}
			} else {
				onLeafMoved(fromRelPath, toRelPath)
			}
		}

		this.forest = new Forest(this.forest).move(oldTreePath, newTreePath).trees
		return toFullPath
	}

	async renameNode(oldRelPath: string, newName: string, onLeafMoved?: (oldRelPath: string, newRelPath: string) => void): Promise<void> {
		this.validatePath(oldRelPath)
		this.validatePath(newName)
		const fromFullPath = Path.resolve(this.path, oldRelPath)
		const toFullPath = Path.resolve(Path.dirname(fromFullPath), newName)
		await Promise.all([
			Fs.rename(fromFullPath, toFullPath),
			updateOrderingNameAt(Path.dirname(fromFullPath), Path.basename(fromFullPath), Path.basename(toFullPath))
		])

		const rootForest = new Forest(this.forest)
		const treePath = this.relPathToTreePath(oldRelPath)
		if(onLeafMoved){
			const tree = rootForest.getTreeAt(treePath)
			const oldPathBase = rootForest.pathToValues(treePath)
			const newPathBase = [...oldPathBase.slice(0, -1), newName]
			if(isTreeBranch(tree)){
				const childForest = new Forest(tree.children)
				for(const [,treePath] of childForest.getLeavesWithPaths()){
					const oldRelPath = [...oldPathBase, ...childForest.pathToValues(treePath)].join("/")
					const newRelPath = [...newPathBase, ...childForest.pathToValues(treePath)].join("/")
					onLeafMoved(oldRelPath, newRelPath)
				}
			} else {
				const newRelPath = [...oldRelPath.split("/").slice(0, -1), newName].join("/")
				onLeafMoved(oldRelPath, newRelPath)
			}
		}

		this.forest = rootForest.updateTreeAt(this.relPathToTreePath(oldRelPath), tree => ({...tree, value: newName})).trees
	}

	* relPathsOfLeaves(): IterableIterator<string> {
		const forest = new Forest(this.forest)
		for(const [,treePath] of forest.getLeavesWithPaths()){
			const pathParts = forest.pathToValues(treePath)
			const relPath = pathParts.join("/")
			yield relPath
		}
	}

}

const insertOrderingEntry = async(dirPath: string, name: string, isBranch: boolean, index: number): Promise<OrderingEntry> => {
	const entry: OrderingEntry = [name]

	let flags = 0
	if(isBranch){
		flags |= OrderingFlags.isBranch
	}
	if(flags !== 0){
		entry.push(flags)
	}

	await updateOrderingAt(
		dirPath,
		ordering => [...ordering.slice(0, index), entry, ...ordering.slice(index)]
	)

	return entry
}

const deleteOrderingEntry = async(dirPath: string, name: string): Promise<OrderingEntry> => {
	let result: OrderingEntry | null = null
	await updateOrderingAt(
		dirPath,
		ordering => {
			return ordering.filter(x => {
				const isThisIt = x[0] === name
				if(isThisIt){
					result = x
				}
				return !isThisIt
			})
		}
	)
	if(!result){
		throw new Error(`No entry with name ${name} found at ordering file in ${dirPath}`)
	}
	return result
}

const updateOrderingNameAt = async(dirPath: string, oldName: string, newName: string): Promise<void> => {
	await updateOrderingAt(dirPath, ordering => ordering.map(x => {
		if(x[0] !== oldName){
			return x
		}
		const flags = x[1]
		return flags !== undefined ? [newName, flags] : [newName]
	}))
}

const updateOrderingAt = async(dirPath: string, updater: (ordering: Ordering) => Ordering): Promise<void> => {
	const orderingPath = Path.resolve(dirPath, orderingFileName)
	let ordering: Ordering = JSON.parse(await Fs.readFile(orderingPath, "utf-8"))
	ordering = updater(ordering)
	await Fs.writeFile(orderingPath, orderingToJson(ordering), "utf-8")
}

const createOrderedDirectoryAt = async(path: string, isBranch: boolean): Promise<void> => {
	await Fs.mkdir(path, {recursive: true})
	if(isBranch){
		const ordering: Ordering = []
		await Fs.writeFile(Path.resolve(path, orderingFileName), orderingToJson(ordering), "utf-8")
	}
}

// pretty-printing for git friendliness
// we don't want to pretty-print ALL of it, only the first "level"
// so here are some hacks to achieve that
const orderingToJson = (ordering: Ordering) => JSON.stringify(ordering)
	.replace(/\],\[/g, "],\n\t[")
	.replace(/^\[\[/, "[\n\t[")
	.replace(/\]\]$/, "]\n]")

const readOrderedDirectoryRecursive = async(path: string): Promise<Tree<string, string>[]> => {
	const orderingJson = await Fs.readFile(Path.resolve(path, orderingFileName), "utf-8")
	const ordering: Ordering = JSON.parse(orderingJson)
	return await Promise.all(ordering.map(async([name, isDirectory]) => {
		if(isDirectory){
			const children = await readOrderedDirectoryRecursive(Path.resolve(path, name))
			return {value: name, children}
		} else {
			return {value: name}
		}
	}))
}
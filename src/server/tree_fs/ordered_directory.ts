import {directoryExists} from "common/file_exists"
import {Tree, TreePath, addTreeByPath, deleteFromTreeByPath, getForestLeaves, getTreeByPath, isTreeBranch, moveTreeByPath, treePathToValues, treeValuesToTreePath, updateTreeByPath} from "common/tree"
import {dropLastPathPart} from "data/project_utils"
import {promises as Fs} from "fs"
import * as Path from "path"

const orderingFileName = ".ordering.json"
enum OrderingFlags {
	isBranch = 1 << 0
}

type OrderingEntry = [name: string, flags?: number]
type Ordering = OrderingEntry[]

/** A wrapper around a filesystem directory that allows to transform it into string tree, and back.
Trees are ordered; ordering is stored in a special files inside each directory.
Caches forest representation of the directory */
export class OrderedDirectory {
	constructor(readonly path: string, public forest: Tree<string, string>[]) {}

	static async createAt(path: string): Promise<OrderedDirectory> {
		return new OrderedDirectory(path, await this.getInitialForest(path))
	}

	static async getInitialForest(path: string): Promise<Tree<string, string>[]> {
		if(!(await directoryExists(path))){
			await createOrderedDirectoryAt(path, true)
			return []
		} else {
			return await readOrderedDirectoryRecursive(path)
		}
	}

	private relPathToTreePath(relPath: string): TreePath {
		const path = treeValuesToTreePath(this.forest, relPath.split(/[/\\]/g).filter(x => !!x))
		if(!path){
			throw new Error("Path not found in tree: " + relPath)
		}
		return path
	}

	private newRelPathToTreePath(relPath: string, index: number): TreePath {
		return [...this.relPathToTreePath(dropLastPathPart(relPath)), index]
	}

	async createNode(relPath: string, index: number, isBranch: boolean): Promise<string> {
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
		this.forest = addTreeByPath(this.forest, tree, this.newRelPathToTreePath(relPath, index))
		return fullPath
	}

	async deleteNode(relPath: string, onLeafDeleted?: (relPath: string) => void): Promise<void> {
		const fullPath = Path.resolve(this.path, relPath)
		await Promise.all([
			Fs.rm(fullPath, {recursive: true}),
			deleteOrderingEntry(Path.dirname(fullPath), Path.basename(fullPath))
		])

		if(onLeafDeleted){
			const deletedTreePath = this.relPathToTreePath(relPath)
			const tree = getTreeByPath(this.forest, deletedTreePath)
			if(isTreeBranch(tree)){
				for(const [,,treePath] of getForestLeaves(tree.children)){
					const fullLeafPath = [...deletedTreePath, ...treePath]
					const leafRelPath = treePathToValues(this.forest, fullLeafPath).join("/")
					onLeafDeleted(leafRelPath)
				}
			} else {
				onLeafDeleted(relPath)
			}
		}

		this.forest = deleteFromTreeByPath(this.forest, this.relPathToTreePath(relPath))
	}

	async moveNode(fromRelPath: string, toRelPath: string, index: number, onLeafMoved?: (oldRelPath: string, newRelPath: string) => void): Promise<string> {
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
			const tree = getTreeByPath(this.forest, oldTreePath)
			if(isTreeBranch(tree)){
				for(const [,,treePath] of getForestLeaves(tree.children)){
					const fullLeafPath = [...oldTreePath, ...treePath]
					const oldRelPath = treePathToValues(this.forest, fullLeafPath).join("/")
					const newRelPath = treePathToValues(this.forest, fullLeafPath).join("/")
					onLeafMoved(oldRelPath, newRelPath)
				}
			} else {
				onLeafMoved(fromRelPath, toRelPath)
			}
		}

		this.forest = moveTreeByPath(this.forest, oldTreePath, newTreePath)
		return toFullPath
	}

	async renameNode(oldRelPath: string, newName: string, onLeafMoved?: (oldRelPath: string, newRelPath: string) => void): Promise<void> {
		const fromFullPath = Path.resolve(this.path, oldRelPath)
		const toFullPath = Path.resolve(Path.dirname(fromFullPath), newName)
		await Promise.all([
			Fs.rename(fromFullPath, toFullPath),
			updateOrderingNameAt(Path.dirname(fromFullPath), Path.basename(fromFullPath), Path.basename(toFullPath))
		])

		const treePath = this.relPathToTreePath(oldRelPath)
		if(onLeafMoved){
			const tree = getTreeByPath(this.forest, treePath)
			const oldPathBase = treePathToValues(this.forest, treePath)
			const newPathBase = [...oldPathBase.slice(0, -1), newName]
			if(isTreeBranch(tree)){
				for(const [,,treePath] of getForestLeaves(tree.children)){
					const oldRelPath = [...oldPathBase, ...treePathToValues(tree.children, treePath)].join("/")
					const newRelPath = [...newPathBase, ...treePathToValues(tree.children, treePath)].join("/")
					onLeafMoved(oldRelPath, newRelPath)
				}
			} else {
				const newRelPath = [...oldRelPath.split("/").slice(0, -1), newName].join("/")
				onLeafMoved(oldRelPath, newRelPath)
			}
		}

		this.forest = updateTreeByPath(this.forest, this.relPathToTreePath(oldRelPath), tree => ({...tree, value: newName}))
	}

	* relPathsOfLeaves(): IterableIterator<string> {
		for(const [,,treePath] of getForestLeaves(this.forest)){
			const pathParts = treePathToValues(this.forest, treePath)
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
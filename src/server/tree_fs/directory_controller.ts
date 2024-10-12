import {Forest, ForestPath, Tree} from "@nartallax/forest"
import {ApiError} from "common/api_response"
import {readdirAsTree} from "common/readdir_as_tree"
import {pathPartRegexp} from "common/regexps"
import {dropLastPathPart, splitPath} from "data/project_utils"
import {promises as Fs} from "fs"
import * as Path from "path"

export type AfterOrderedDirectoryModifyEvent = {
	// valueType === "item" guarantees that tree wasn't changed
	// valueType === "tree" guarantees that item value wasn't changed
	valueType: "tree" | "treeOrItem" | "item"
	// relative path
	path: string
}

type Props = {
	rootPath: string
	afterModified?: (evt: AfterOrderedDirectoryModifyEvent) => void | Promise<void>
}

const stringify = (value: unknown) => JSON.stringify(value, null, "\t")
const parse = (value: string): unknown => JSON.parse(value)
const comparator = (a: Tree<string, string>, b: Tree<string, string>) => a.value < b.value ? -1 : 1

/** Wrapper around a directory that provides nice API around it */
export class DirectoryController {
	static async create(props: Props): Promise<DirectoryController> {
		await Fs.mkdir(props.rootPath, {recursive: true})
		const trees = await readdirAsTree(props.rootPath)
		return new DirectoryController(props.rootPath, new Forest(trees))
	}

	constructor(
		readonly rootPath: string,
		private forest: Forest<string, string>,
		private readonly afterModified?: Props["afterModified"]
	) {
		this.forest = this.forest.sort(comparator)
	}

	getTrees(): readonly Tree<string, string>[] {
		return this.forest.trees
	}

	async findMatchingItems(pathMatcher: (relPath: string) => boolean, itemMatcher: (item: unknown, relPath: string) => boolean): Promise<{item: unknown, relPath: string}[]> {
		const result: {item: unknown, relPath: string}[] = []

		await Promise.all([...this.forest.getLeavesWithPaths()].map(async([,path]) => {
			const relPath = this.treePathToRelPath(path)
			if(!pathMatcher){
				return
			}
			const absPath = Path.resolve(this.rootPath, relPath)
			const item = parse(await Fs.readFile(absPath, "utf-8"))
			if(itemMatcher(item, relPath)){
				result.push({item, relPath})
			}
		}))

		return result
	}

	async createItem(relPath: string, value: unknown): Promise<void> {
		this.validatePath(relPath)
		const absPath = Path.resolve(this.rootPath, relPath)
		await this.maybeCreateParentDirectory(absPath)
		await Fs.writeFile(absPath, stringify(value), "utf-8")
		this.createTreeNode(relPath, {value: Path.basename(relPath)})
		await this.callAfterModify({valueType: "treeOrItem", path: relPath})
	}

	async updateItem(relPath: string, value: unknown): Promise<void> {
		this.validatePath(relPath)
		const absPath = Path.resolve(this.rootPath, relPath)
		await Fs.writeFile(absPath, stringify(value))
		await this.callAfterModify({valueType: "item", path: relPath})
	}

	async createDirectory(relPath: string): Promise<void> {
		this.validatePath(relPath)
		const absPath = Path.resolve(this.rootPath, relPath)
		await Fs.mkdir(absPath, {recursive: true})
		this.createTreeNode(relPath, {value: Path.basename(relPath), children: []})
		await this.callAfterModify({valueType: "tree", path: relPath})
	}

	async moveNode(fromRelPath: string, toRelPath: string): Promise<void> {
		this.validatePath(fromRelPath)
		this.validatePath(toRelPath)

		const fromAbsPath = Path.resolve(this.rootPath, fromRelPath)
		const toAbsPath = Path.resolve(this.rootPath, toRelPath)
		await Fs.rename(fromAbsPath, toAbsPath)

		const oldTreePath = this.relPathToTreePath(fromRelPath)
		const newTreePath = this.newRelPathToTreePath(toRelPath)
		this.forest = this.forest.move(oldTreePath, newTreePath, comparator)

		await this.callAfterModify({valueType: "treeOrItem", path: toRelPath})
	}

	async deleteNode(relPath: string): Promise<void> {
		this.validatePath(relPath)
		const absPath = Path.resolve(this.rootPath, relPath)
		await Fs.rm(absPath, {recursive: true})

		this.forest = this.forest.deleteAt(this.relPathToTreePath(relPath))

		await this.callAfterModify({valueType: "treeOrItem", path: relPath})
	}

	async getItemByPath(relPath: string): Promise<unknown> {
		this.validatePath(relPath)
		const absPath = Path.resolve(this.rootPath, relPath)
		return parse(await Fs.readFile(absPath, "utf-8"))
	}

	private validatePath(relPathOrPart: string): void {
		for(const pathPart of splitPath(relPathOrPart)){
			if(!pathPartRegexp.test(pathPart)){
				throw new ApiError(`Name "${pathPart}" is not a valid path part.`)
			}
		}
	}

	private async callAfterModify(event: AfterOrderedDirectoryModifyEvent) {
		if(this.afterModified){
			await Promise.resolve(this.afterModified(event))
		}
	}

	private async maybeCreateParentDirectory(absPath: string): Promise<void> {
		const absDirPath = Path.dirname(absPath)
		await Fs.mkdir(absDirPath, {recursive: true})
	}

	private createTreeNode(relPath: string, node: Tree<string, string>) {
		const treePath = this.newRelPathToTreePath(relPath)
		this.forest = this.forest.insertTreeAt(treePath, node, comparator)
	}

	private relPathToTreePath(relPath: string): ForestPath {
		const path = this.forest.valuesToPath(relPath.split(/[/\\]/g).filter(x => !!x))
		if(!path){
			throw new Error("Path not found in tree: " + relPath)
		}
		return path
	}

	private newRelPathToTreePath(relPath: string): ForestPath {
		return [...this.relPathToTreePath(dropLastPathPart(relPath)), 0]
	}

	private treePathToRelPath(treePath: ForestPath): string {
		return this.forest.pathToValues(treePath).join("/")
	}

}
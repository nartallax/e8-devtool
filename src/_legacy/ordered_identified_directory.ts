import {UUID} from "common/uuid"
import {ObjectPartitioner} from "_legacy/object_partitioner"
import {OrderedDirectory} from "_legacy/ordered_directory"
import * as Path from "path"
import {DualMap} from "common/dual_map"
import {nonNull} from "common/non_null"
import {replaceLastPathPart} from "data/project_utils"
import {Forest, Tree} from "@nartallax/forest"

export type AfterOrderedDirectoryModifyEvent = {
	// valueType === "item" guarantees that tree wasn't changed
	// valueType === "tree" guarantees that item value wasn't changed
	valueType: "tree" | "treeOrItem" | "item"
	path: string
}

type Props<T> = {
	getPartitions: (partitioner: ObjectPartitioner<T>) => ObjectPartitioner<T>
	afterModified?: (evt: AfterOrderedDirectoryModifyEvent) => void | Promise<void>
}

/** OrderedDirectory that has some logic about manipulating data stored in its leaves  */
export class OrderedIdentifiedDirectory<T extends {id: UUID} = {id: UUID}> {
	constructor(private dir: OrderedDirectory, private idPathMap: DualMap<UUID, string>, private partitioner: ObjectPartitioner<T>, private props: Props<T>) {}

	static async createAt<T extends {id: UUID}>(path: string, props: Props<T>): Promise<OrderedIdentifiedDirectory<T>> {
		let partitioner = new ObjectPartitioner<T>()
		partitioner = props.getPartitions(partitioner)
		const trees = await OrderedDirectory.getInitialForest(path)
		const map = await this.getIdPathMapping(path, trees, partitioner)
		return new OrderedIdentifiedDirectory<T>(new OrderedDirectory(path, trees), map, partitioner, props)
	}

	protected static async getIdPathMapping<T extends {id: UUID}>(path: string, trees: readonly Tree<string, string>[], partitioner: ObjectPartitioner<T>): Promise<DualMap<UUID, string>> {
		const result = new DualMap<UUID, string>()

		const forest = new Forest(trees)
		await Promise.all(
			[...forest.getLeavesWithPaths()].map(async([,treePath]) => {
				const pathParts = forest.pathToValues(treePath)
				const relPath = pathParts.join("/")
				const itemDirPath = Path.resolve(path, relPath)
				const id = await partitioner.readField(itemDirPath, "id")
				result.set(id, relPath)
			})
		)

		return result
	}

	private async callAfterModify(event: AfterOrderedDirectoryModifyEvent) {
		if(this.props.afterModified){
			await Promise.resolve(this.props.afterModified(event))
		}
	}

	async createDirectory(relPath: string, index: number): Promise<void> {
		await this.dir.createNode(relPath, index, true)
		await this.callAfterModify({valueType: "tree", path: relPath})
	}

	async createItem(relPath: string, index: number, value: T): Promise<void> {
		const itemDirPath = await this.dir.createNode(relPath, index, false)
		await this.partitioner.partitionAndWrite(itemDirPath, value)
		this.idPathMap.set(value.id, relPath)
		await this.callAfterModify({valueType: "treeOrItem", path: relPath})
	}

	async deleteNode(relPath: string): Promise<void> {
		await this.dir.deleteNode(relPath, relPath => {
			this.idPathMap.deleteB(relPath)
		})
		await this.callAfterModify({valueType: "treeOrItem", path: relPath})
	}

	private onItemPathUpdated = (oldRelPath: string, newRelPath: string) => {
		const id = this.idPathMap.getA(oldRelPath)
		this.idPathMap.set(id, newRelPath)
	}

	async moveNode(fromRelPath: string, toRelPath: string, index: number): Promise<void> {
		await this.dir.moveNode(fromRelPath, toRelPath, index, this.onItemPathUpdated)
		await this.callAfterModify({valueType: "treeOrItem", path: toRelPath})
	}

	async renameNode(oldRelPath: string, newName: string): Promise<void> {
		await this.dir.renameNode(oldRelPath, newName, this.onItemPathUpdated)
		await this.callAfterModify({valueType: "treeOrItem", path: replaceLastPathPart(oldRelPath, newName)})
	}

	async getItemById(id: UUID): Promise<T> {
		return await this.getItemByPath(this.idPathMap.getB(id))
	}

	async getItemByPath(relPath: string): Promise<T> {
		return await this.partitioner.readAndAssemble(Path.resolve(this.dir.path, relPath))
	}

	getPath(id: UUID): string {
		return this.idPathMap.getB(id)
	}

	async getAllItemsAsMap(): Promise<Record<string, T>> {
		const result: Record<string, T> = {}

		await Promise.all([...this.dir.relPathsOfLeaves()].map(async relPath => {
			const fullPath = Path.resolve(this.dir.path, relPath)
			const item = await this.partitioner.readAndAssemble(fullPath)
			result[relPath] = item
		}))

		return result
	}

	async getAllItemsAsArray(): Promise<T[]> {
		return await Promise.all([...this.dir.relPathsOfLeaves()].map(async relPath => {
			const fullPath = Path.resolve(this.dir.path, relPath)
			return await this.partitioner.readAndAssemble(fullPath)
		}))
	}

	async getFieldOfAllItemsAsArray<K extends keyof T>(fieldName: K): Promise<T[K][]> {
		return await Promise.all([...this.dir.relPathsOfLeaves()].map(async relPath => {
			const fullPath = Path.resolve(this.dir.path, relPath)
			return await this.partitioner.readField(fullPath, fieldName)
		}))
	}

	async updateItem(item: T): Promise<void> {
		const relPath = this.idPathMap.getB(item.id)
		await this.partitioner.partitionAndWrite(Path.resolve(this.dir.path, relPath), item)
		await this.callAfterModify({valueType: "item", path: relPath})
	}

	async findPathsOfItemsWithFieldValue<K extends keyof T>(field: K, value: T[K]): Promise<string[]> {
		return (await Promise.all([...this.dir.relPathsOfLeaves()].map(async relPath => {
			const fullPath = Path.resolve(this.dir.path, relPath)
			const fieldValue = await this.partitioner.readField(fullPath, field)
			return fieldValue === value ? relPath : null
		}))).filter(nonNull)
	}

	getForest(): readonly Tree<string, string>[] {
		return this.dir.forest
	}

}
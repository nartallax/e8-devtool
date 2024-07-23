import {Tree, getForestLeaves, treePathToValues} from "common/tree"
import {UUID} from "common/uuid"
import {ObjectPartitioner} from "server/tree_fs/object_partitioner"
import {OrderedDirectory} from "server/tree_fs/ordered_directory"
import * as Path from "path"
import {DualMap} from "common/dual_map"
import {nonNull} from "common/non_null"

type Props<T> = {
	getPartitions: (partitioner: ObjectPartitioner<T>) => ObjectPartitioner<T>
}

/** OrderedDirectory that has some logic about manipulating data stored in its leaves  */
export class OrderedIdentifiedDirectory<T extends {id: UUID} = {id: UUID}> {
	constructor(private dir: OrderedDirectory, private idPathMap: DualMap<UUID, string>, private partitioner: ObjectPartitioner<T>) {}

	static async createAt<T extends {id: UUID}>(path: string, props: Props<T>): Promise<OrderedIdentifiedDirectory<T>> {
		let partitioner = new ObjectPartitioner<T>()
		partitioner = props.getPartitions(partitioner)
		const forest = await OrderedDirectory.getInitialForest(path)
		const map = await this.getIdPathMapping(path, forest, partitioner)
		return new OrderedIdentifiedDirectory<T>(new OrderedDirectory(path, forest), map, partitioner)
	}

	protected static async getIdPathMapping<T extends {id: UUID}>(path: string, forest: Tree<string, string>[], partitioner: ObjectPartitioner<T>): Promise<DualMap<UUID, string>> {
		const result = new DualMap<UUID, string>()

		await Promise.all(
			[...getForestLeaves(forest)].map(async([,,treePath]) => {
				const pathParts = treePathToValues(forest, treePath)
				const relPath = pathParts.join("/")
				const itemDirPath = Path.resolve(path, relPath)
				const id = await partitioner.readField(itemDirPath, "id")
				result.set(id, relPath)
			})
		)

		return result
	}

	async createDirectory(relPath: string, index: number): Promise<void> {
		await this.dir.createNode(relPath, index, true)
	}

	async createItem(relPath: string, index: number, value: T): Promise<void> {
		const itemDirPath = await this.dir.createNode(relPath, index, false)
		await this.partitioner.partitionAndWrite(itemDirPath, value)
		this.idPathMap.set(value.id, relPath)
	}

	async deleteNode(relPath: string): Promise<void> {
		await this.dir.deleteNode(relPath, relPath => this.idPathMap.deleteB(relPath))
	}

	private onItemPathUpdated = (oldRelPath: string, newRelPath: string) => {
		const id = this.idPathMap.getA(oldRelPath)
		this.idPathMap.set(id, newRelPath)
	}

	async moveNode(fromRelPath: string, toRelPath: string, index: number): Promise<void> {
		await this.dir.moveNode(fromRelPath, toRelPath, index, this.onItemPathUpdated)
	}

	async renameNode(oldRelPath: string, newName: string): Promise<void> {
		await this.dir.renameNode(oldRelPath, newName, this.onItemPathUpdated)
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

	async updateItem(item: T): Promise<void> {
		const relPath = this.idPathMap.getB(item.id)
		await this.partitioner.partitionAndWrite(Path.resolve(this.dir.path, relPath), item)
	}

	async findPathsOfItemsWithFieldValue<K extends keyof T>(field: K, value: T[K]): Promise<string[]> {
		return (await Promise.all([...this.dir.relPathsOfLeaves()].map(async relPath => {
			const fullPath = Path.resolve(this.dir.path, relPath)
			const fieldValue = await this.partitioner.readField(fullPath, field)
			return fieldValue === value ? relPath : null
		}))).filter(nonNull)
	}

	getForest(): Tree<string, string>[] {
		return this.dir.forest
	}

}
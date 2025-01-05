import {TableHierarchy, TableRowSequenceDesignator} from "client/components/table/table"

/** An immutable tree of numbers. Numbers mean indices in tree. */
export class TableExpansionTree {
	constructor(readonly children: ReadonlyMap<number, TableExpansionTree> = new Map()) {}

	addHierarchy<T>(path: TableHierarchy<T>): TableExpansionTree {
		return this.add(path.map(x => x.rowIndex))
	}

	removeHierarchy<T>(path: TableHierarchy<T>): TableExpansionTree {
		return this.remove(path.map(x => x.rowIndex))
	}

	hasHierarchy<T>(path: TableHierarchy<T>): boolean {
		return this.has(path.map(x => x.rowIndex))
	}

	add(path: readonly number[], offset = 0): TableExpansionTree {
		if(path.length <= offset){
			return this
		}
		const index = path[offset]!
		let child = this.children.get(index)
		if(!child){
			child = new TableExpansionTree()
		}
		child = child.add(path, offset + 1)
		return new TableExpansionTree(new Map([...this.children, [index, child]]))
	}

	private getParent(path: readonly number[], offset = 0): TableExpansionTree | null {
		if(path.length <= offset){
			throw new Error("Path is too short")
		}
		if(path.length - 1 === offset){
			return this
		}
		const child = this.children.get(path[offset]!)
		if(!child){
			return null
		}
		return child.getParent(path, offset + 1)
	}

	private updateParent(path: readonly number[], updater: (children: Map<number, TableExpansionTree>, lastIndex: number, srcMap: typeof this.children) => void, offset = 0): TableExpansionTree {
		if(path.length <= offset){
			throw new Error("Path is too short")
		}
		const index = path[offset]!
		if(path.length - 1 === offset){
			const map = new Map(this.children)
			updater(map, index, this.children)
			return new TableExpansionTree(map)
		}
		let child = this.children.get(index)
		if(!child){
			return this
		}
		child = child.updateParent(path, updater, offset + 1)
		const map = new Map(this.children)
		map.set(index, child)
		return new TableExpansionTree(map)
	}

	remove(path: readonly number[]): TableExpansionTree {
		return this.updateParent(path, (map, index) => {
			map.delete(index)
		})
	}

	removeDesignator(designator: TableRowSequenceDesignator): TableExpansionTree {
		return this.updateParent(designator.firstRow, (map, index) => {
			for(let i = index; i < index + designator.count; i++){
				map.delete(i)
			}
		})
	}

	getPresentDesignatorPathOffsets(designator: TableRowSequenceDesignator): number[] {
		const node = this.getParent(designator.firstRow)
		const result: number[] = []
		if(!node){
			return result
		}
		const firstIndex = designator.firstRow[designator.firstRow.length - 1]!
		for(let offset = 0; offset < designator.count; offset++){
			if(node.children.has(firstIndex + offset)){
				result.push(offset)
			}
		}
		return result
	}

	has(path: readonly number[]): boolean {
		const parent = this.getParent(path)
		return parent?.children.has(path[path.length - 1]!) ?? false
	}

	hasParent(path: readonly number[]): boolean {
		return !!this.getParent(path)
	}

	// supposed to be called after a part of a tree is moved from one place to another
	// mult = 1 when adding, -1 when removing
	shiftIndicesByDesignator(designator: TableRowSequenceDesignator, mult: number): TableExpansionTree {
		return this.updateParent(designator.firstRow, (map, index, srcMap) => {
			const shift = designator.count * mult
			const limit = mult > 0 ? index : index + designator.count
			for(const num of srcMap.keys()){
				if(num < limit){
					continue
				}
				map.delete(num)
				map.set(num + shift, srcMap.get(num)!)
			}
		})
	}

	toString(): string {
		return this.toStringInternal(this.children).join("\n")
	}

	private toStringInternal(
		children: ReadonlyMap<number, TableExpansionTree>,
		depth = 0,
		result: string[] = [],
		prefixArr: string[] = []
	): string[] {
		const trees = [...children.entries()]
		for(let i = 0; i < trees.length; i++){
			const prefix = [...prefixArr].join("") + (i < trees.length - 1 ? "├" : "└")
			const [index, node] = trees[i]!
			result.push(prefix + index)
			prefixArr.push(i < trees.length - 1 ? "│" : " ")
			this.toStringInternal(node.children, depth + 1, result, prefixArr)
			prefixArr.pop()
		}
		return result
	}
}
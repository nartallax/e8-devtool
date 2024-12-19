import {TableHierarchy} from "client/components/table/table"

type CacheSubscriber<T> = (cacheEntry: {rows: T[], isThereMore: boolean}) => void

type CacheNode<T> = {
	value: T
	notifySubscriber: CacheSubscriber<T> | null
	children: CacheNode<T>[] | null
	isThereMore: boolean
}

export class TableDataCache<T> implements CacheNode<T> {
	children = []
	notifySubscriber: CacheSubscriber<T> | null = null
	isThereMore = true
	revision = 0

	reset() {
		this.revision++
		this.children = []
		this.isThereMore = true
		this.notifySubscriber?.({isThereMore: true, rows: []})
	}

	get value(): T {
		throw new Error("Root cache node has no value")
	}

	set value(newValue: T) {
		void newValue
		throw new Error("Root cache node has no value")
	}

	private findNode(path: number[]): CacheNode<T> | null {
		let node: CacheNode<T> = this
		for(let i = 0; i < path.length; i++){
			const rowIndex = path[i]!
			const childNode = node.children?.[rowIndex]
			if(!childNode){
				return null
			}
			node = childNode
		}
		return node
	}

	private findNodeOrThrow(path: number[]): CacheNode<T> {
		const node = this.findNode(path)
		if(!node){
			throw new Error(`Cannot find cache node for path ${JSON.stringify(path)}`)
		}
		return node
	}

	private findParentNodeOrThrow(path: number[]): CacheNode<T> {
		if(path.length === 0){
			throw new Error("Cannot get parent of root cache node.")
		}
		return this.findNodeOrThrow(path.slice(0, path.length - 1))
	}

	setCachedChildren(hierarchy: TableHierarchy<T>, rows: T[], isThereMore: boolean) {
		const node = this.findNodeOrThrow(hierarchy.map(x => x.rowIndex))
		const nodes = node.children ?? []

		const newNodes: CacheNode<T>[] = []
		for(let i = 0; i < rows.length; i++){
			const oldNode = nodes[i]
			newNodes[i] = {
				value: rows[i]!,
				children: oldNode?.children ?? null,
				notifySubscriber: oldNode?.notifySubscriber ?? null,
				isThereMore: oldNode?.isThereMore ?? true
			}
		}

		node.children = newNodes
		node.isThereMore = isThereMore
		node.notifySubscriber?.({rows, isThereMore})
	}

	getCachedChildren(hierarchy: TableHierarchy<T>): {rows: T[], isThereMore: boolean} {
		const node = this.findNode(hierarchy.map(x => x.rowIndex))
		const rows = (node?.children ?? []).map(node => node.value)
		const isThereMore = node?.isThereMore ?? true
		return {rows, isThereMore}
	}

	getRowByPath(path: number[]): T {
		return this.findNodeOrThrow(path).value
	}

	getParentByPath(path: number[]): T {
		return this.findParentNodeOrThrow(path).value
	}

	addSubscriber(hierarchy: TableHierarchy<T>, notify: CacheSubscriber<T>) {
		const node = this.findNodeOrThrow(hierarchy.map(x => x.rowIndex))
		// this looks bad in theory, because we could clobber something
		// but in fact every node will have one subscriber at most, so it's fint
		node.notifySubscriber = notify
	}

	removeSubscriber(hierarchy: TableHierarchy<T>) {
		const node = this.findNode(hierarchy.map(x => x.rowIndex))
		if(!node){
			// this can happen when several levels of tree are uncollapsed when cache is reset
			// nothing to do here, we already implicitly removed the subscriber at this point
			return
		}
		node.notifySubscriber = null
	}

	moveRow(fromPath: number[], toPath: number[]) {
		toPath = updateMovePath(fromPath, toPath)
		const fromIndex = fromPath[fromPath.length - 1]!
		const toIndex = toPath[toPath.length - 1]!

		const fromParentNode = this.findParentNodeOrThrow(fromPath)

		let fromSeq = fromParentNode.children ?? []
		const movedNode = fromSeq[fromIndex]!
		fromSeq = [...fromSeq.slice(0, fromIndex), ...fromSeq.slice(fromIndex + 1)]
		fromParentNode.children = fromSeq

		const toParentNode = this.findParentNodeOrThrow(toPath)
		if(toParentNode.children){
			// user can make a row be a child of another row which children are not loaded yet
			// we could just assume that first row will become first child, but that will only work on some datasources
			// in general it would be safer to not insert this row anywhere, and maybe fetch it again later among others
			let toSeq = toParentNode.children
			toSeq = [...toSeq.slice(0, toIndex), movedNode, ...toSeq.slice(toIndex)]
			toParentNode.children = toSeq
		}

		fromParentNode.notifySubscriber?.({
			rows: fromParentNode.children.map(x => x.value),
			isThereMore: fromParentNode.isThereMore
		})
		if(toParentNode !== fromParentNode && toParentNode.children){
			toParentNode.notifySubscriber?.({
				rows: toParentNode.children.map(x => x.value),
				isThereMore: toParentNode.isThereMore
			})
		}
	}

	pathToHierarchy(path: number[]): TableHierarchy<T> {
		const result: TableHierarchy<T> = []
		let node: CacheNode<T> = this
		for(const index of path){
			const childNode = node.children?.[index]
			if(!childNode){
				throw new Error(`Cannot find cache node for path ${JSON.stringify(path)}`)
			}
			result.push({row: childNode.value, parentLoadedRowsCount: node.children?.length ?? 0, rowIndex: index})
			node = childNode
		}
		return result
	}
}

// this helps to avoid wrong index shift after move happens
const updateMovePath = (from: number[], to: number[]): number[] => {
	const result = [...to]
	for(let i = 0; i < Math.min(from.length, to.length); i++){
		if(from[i]! < to[i]!){
			result[i]!--
			break
		}
	}
	return result
}
import {TableHierarchy} from "client/components/table/table"

type CacheNode<T> = {
	value: T
	notifySubscriber: ((values: T[]) => void) | null
	children: CacheNode<T>[] | null
	isThereMore: boolean
}

export class TableDataCache<T> implements CacheNode<T> {
	children = []
	notifySubscriber = null
	isThereMore = true

	get value(): T {
		throw new Error("Root cache node has no value")
	}

	set value(newValue: T) {
		void newValue
		throw new Error("Root cache node has no value")
	}

	private findNode(hierarchy: TableHierarchy<T>): CacheNode<T> | null {
		let node: CacheNode<T> = this
		for(let i = 0; i < hierarchy.length; i++){
			const {rowIndex} = hierarchy[i]!
			const childNode = node.children?.[rowIndex]
			if(!childNode){
				return null
			}
			node = childNode
		}
		return node
	}

	private findNodeOrThrow(hierarchy: TableHierarchy<T>): CacheNode<T> {
		const node = this.findNode(hierarchy)
		if(!node){
			throw new Error(`Cannot find cache node for path ${JSON.stringify(hierarchy.map(x => x.rowIndex))}`)
		}
		return node
	}

	private findParentNodeByPathOrThrow(path: number[]): CacheNode<T> {
		if(path.length === 0){
			throw new Error("Cannot get parent of root cache node.")
		}
		let node: CacheNode<T> | undefined = this
		for(let i = 0; i < path.length - 1; i++){
			node = node?.children?.[path[i]!]
		}
		if(!node){
			throw new Error(`Cannot find cache node for path ${JSON.stringify(path)}`)
		}
		return node
	}

	set(hierarchy: TableHierarchy<T>, rows: T[], isThereMore: boolean) {
		const node = this.findNodeOrThrow(hierarchy)
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
		node.notifySubscriber?.(rows)
	}

	get(hierarchy: TableHierarchy<T>): {rows: T[], isThereMore: boolean} {
		const node = this.findNode(hierarchy)
		const rows = (node?.children ?? []).map(node => node.value)
		const isThereMore = node?.isThereMore ?? true
		return {rows, isThereMore}
	}

	addSubscriber(hierarchy: TableHierarchy<T>, notify: (rows: T[]) => void) {
		const node = this.findNodeOrThrow(hierarchy)
		// this looks bad in theory, because we could clobber something
		// but in fact every node will have one subscriber at most, so it's fint
		node.notifySubscriber = notify
	}

	removeSubscriber(hierarchy: TableHierarchy<T>) {
		const node = this.findNodeOrThrow(hierarchy)
		node.notifySubscriber = null
	}

	moveRow(from: TableHierarchy<T>, to: TableHierarchy<T>) {
		const fromPath = from.map(x => x.rowIndex)
		let toPath = to.map(x => x.rowIndex)
		toPath = updateMovePath(fromPath, toPath)
		const fromIndex = fromPath[fromPath.length - 1]!
		const toIndex = toPath[toPath.length - 1]!

		const fromParentNode = this.findParentNodeByPathOrThrow(fromPath)

		let fromSeq = fromParentNode.children ?? []
		const movedNode = fromSeq[fromIndex]!
		fromSeq = [...fromSeq.slice(0, fromIndex), ...fromSeq.slice(fromIndex + 1)]
		fromParentNode.children = fromSeq

		const toParentNode = this.findParentNodeByPathOrThrow(toPath)
		let toSeq = fromParentNode === toParentNode ? fromSeq : toParentNode.children ?? []
		toSeq = [...toSeq.slice(0, toIndex), movedNode, ...toSeq.slice(toIndex)]
		toParentNode.children = toSeq

		fromParentNode.notifySubscriber?.(fromSeq.map(x => x.value))
		if(toParentNode.notifySubscriber !== fromParentNode.notifySubscriber){
			toParentNode.notifySubscriber?.(toSeq.map(x => x.value))
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
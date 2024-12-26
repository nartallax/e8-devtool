import {TableHierarchy, TableHierarchyEntry} from "client/components/table/table"

export namespace TableUtils {

	type GetChildren<T> = ((row: T) => readonly T[]) | undefined

	export const pathToHierarchy = <T>(data: readonly T[], getChildren: GetChildren<T>, path: number[]): TableHierarchy<T> => {
		const result: TableHierarchyEntry<T>[] = []
		let rows: readonly T[] | undefined = data
		for(const index of path){
			const childNode: T | undefined = rows?.[index]
			if(!childNode){
				throw new Error(`Cannot find data line for path ${JSON.stringify(path)}`)
			}
			result.push({row: childNode, parentLoadedRowsCount: rows!.length, rowIndex: index})
			rows = getChildren?.(childNode)
		}
		return result
	}

	const findRow = <T>(data: readonly T[], getChildren: GetChildren<T>, path: number[]): T | null => {
		let rows: readonly T[] | undefined = data
		let node: T | undefined
		for(let i = 0; i < path.length; i++){
			const rowIndex = path[i]!
			node = rows?.[rowIndex]
			if(!node){
				break
			}
			rows = getChildren?.(node)
		}
		return node ?? null
	}

	export const findRowOrThrow = <T>(data: readonly T[], getChildren: GetChildren<T>, path: number[]): T => {
		const node = findRow(data, getChildren, path)
		if(!node){
			throw new Error(`Cannot find cache node for path ${JSON.stringify(path)}`)
		}
		return node
	}

	export const findParentRowOrThrow = <T>(data: readonly T[], getChildren: GetChildren<T>, path: number[]): T => {
		if(path.length === 0){
			throw new Error("Cannot get parent of root cache node.")
		}
		return findRowOrThrow(data, getChildren, path.slice(0, path.length - 1))
	}

}
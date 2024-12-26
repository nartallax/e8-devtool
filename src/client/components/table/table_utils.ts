import {TableColumnDefinition, TableColumnDefinitions, TableHierarchy, TableHierarchyEntry, TableRow} from "client/components/table/table"

export namespace TableUtils {

	export const pathToHierarchy = <K extends string>(data: readonly TableRow<K>[], path: number[]): TableHierarchy<K> => {
		const result: TableHierarchyEntry<K>[] = []
		let rows: readonly TableRow<K>[] | undefined = data
		for(const index of path){
			const childRow: TableRow<K> | undefined = rows?.[index]
			if(!childRow){
				throw new Error(`Cannot find data line for path ${JSON.stringify(path)}`)
			}
			result.push({row: childRow, parentLoadedRowsCount: rows!.length, rowIndex: index})
			rows = childRow.children
		}
		return result
	}

	const findRow = <K extends string>(data: readonly TableRow<K>[], path: number[]): TableRow<K> | null => {
		let rows: readonly TableRow<K>[] | undefined = data
		let node: TableRow<K> | undefined
		for(let i = 0; i < path.length; i++){
			const rowIndex = path[i]!
			node = rows?.[rowIndex]
			if(!node){
				break
			}
			rows = node.children
		}
		return node ?? null
	}

	export const findRowOrThrow = <K extends string>(data: readonly TableRow<K>[], path: number[]): TableRow<K> => {
		const node = findRow(data, path)
		if(!node){
			throw new Error(`Cannot find cache node for path ${JSON.stringify(path)}`)
		}
		return node
	}

	export const findParentRowOrThrow = <K extends string>(data: readonly TableRow<K>[], path: number[]): TableRow<K> => {
		if(path.length === 0){
			throw new Error("Cannot get parent of root cache node.")
		}
		return findRowOrThrow(data, path.slice(0, path.length - 1))
	}

	export const colEntries = <K extends string>(columns: TableColumnDefinitions<K>) =>
		Object.entries(columns) as [id: K, column: TableColumnDefinition][]

	export const colDefs = <K extends string>(columns: TableColumnDefinitions<K>): TableColumnDefinition[] => Object.values(columns)
	export const colIds = <K extends string>(columns: TableColumnDefinitions<K>) => Object.keys(columns) as K[]

}
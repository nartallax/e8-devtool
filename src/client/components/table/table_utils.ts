import {TableHierarchy, TableHierarchyEntry, TableProps} from "client/components/table/table"

export namespace TableUtils {

	type GetChildren<T> = TableProps<T>["getChildren"]

	export const pathToHierarchy = <T>(data: readonly T[], getChildren: GetChildren<T>, path: number[]): TableHierarchy<T> => {
		const result: TableHierarchyEntry<T>[] = []
		let rows: readonly T[] | null | undefined = data
		for(const index of path){
			const childRow: T | undefined = rows?.[index]
			if(!childRow){
				throw new Error(`Cannot find data line for path ${JSON.stringify(path)}`)
			}
			result.push({row: childRow, parentLoadedRowsCount: rows!.length, rowIndex: index})
			rows = getChildren?.(childRow)
		}
		return result
	}

	const findRow = <T>(data: readonly T[], getChildren: GetChildren<T>, path: number[]): T | null => {
		let rows: readonly T[] | null | undefined = data
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

	export const locationMatchesHierarchy = <T>(location: readonly number[], hierarchy: TableHierarchy<T>): boolean => {
		if(location.length !== hierarchy.length){
			return false
		}

		// we go in reverse here because statistically we will find first discrepancy faster this way
		for(let i = location.length - 1; i >= 0; i--){
			if(location[i] !== hierarchy[i]!.rowIndex){
				return false
			}
		}

		return true
	}

	export const hierarchyStartsWithLocation = <T>(location: readonly number[], hierarchy: TableHierarchy<T>): boolean => {
		if(location.length < hierarchy.length){
			return false
		}

		for(let i = 0; i < hierarchy.length; i++){
			if(location[i] !== hierarchy[i]!.rowIndex){
				return false
			}
		}

		return true
	}

}
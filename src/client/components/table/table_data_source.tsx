import {TableHierarchy} from "client/components/table/table"
import {useCallback, useMemo} from "react"

export type TableDataSourceDefinition<T> = {
	getRowKey: (row: T, index: number) => React.Key
	/** Check if this row can theoretically have children.
	If true - user will be able to expand the row, at which point children will be loaded */
	canHaveChildren?: (row: T) => boolean
	loadData: (opts: TableDataLoadOptions<T>) => TableDataLoadResult<T>
}

export type TableDataLoadOptions<T> = {
	/** Previous row in the sequence of row. Null if this call is supposed to load first row. */
	previousRow: T | null
	/** Amount of rows already present in the sequence */
	offset: number
	/** Hierarchy of rows from root to parent. */
	hierarchy: TableHierarchy<T>
	/** Parent of rows we are trying to load. null in case of root row list.
	Can be calculated from hierarchy; separate field is just for convenience. */
	parent: T | null
}

type PromiseOrNot<T> = T | Promise<T>

type TableDataLoadResult<T> = PromiseOrNot<T[] | {
	data: T[]
	isThereMore: boolean
}>

const getFalse = () => false
const getSecondParam = <T,>(_: unknown, b: T) => b

/** Data source manages data loading for the table */
export type TableDataSource<T> = {
	getRowKey: (row: T, index: number) => React.Key
	canHaveChildren: (row: T) => boolean
	loadNextRows: (hierarchy: TableHierarchy<T>, knownRows: T[]) => Promise<{newRows: T[], isThereMore: boolean}>
	/** Can this data source ever return something meaningful for non-null parent? */
	isTreeDataSource: boolean
}

export const useTableDataSource = <T,>({loadData, getRowKey, canHaveChildren}: TableDataSourceDefinition<T>): TableDataSource<T> => {
	const loadNextRows = useCallback(async(hierarchy: TableHierarchy<T>, knownRows: T[]) => {
		const opts: TableDataLoadOptions<T> = {
			parent: hierarchy[hierarchy.length - 1]?.row ?? null,
			hierarchy,
			offset: knownRows.length,
			previousRow: knownRows[knownRows.length - 1] ?? null
		}

		const nextPage = await Promise.resolve(loadData(opts))
		let newRows: T[]
		let isThereMore: boolean
		if(Array.isArray(nextPage)){
			newRows = nextPage
			// we cannot rely on the fact that page size from data source will be consistent
			// it probably will be, but the only way to know for sure if all data is loaded is to wait for empty page
			isThereMore = nextPage.length > 0
		} else {
			newRows = nextPage.data
			isThereMore = nextPage.isThereMore
		}

		return {isThereMore, newRows}
	}, [loadData])

	return useMemo(() => ({
		getRowKey: getRowKey ?? getSecondParam,
		canHaveChildren: canHaveChildren ?? getFalse,
		loadNextRows,
		isTreeDataSource: !!canHaveChildren
	}), [getRowKey, canHaveChildren, loadNextRows])
}
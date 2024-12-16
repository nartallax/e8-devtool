import {TableHierarchy} from "client/components/table/table"
import {TableDataCache} from "client/components/table/table_data_cache"
import {useCallback, useLayoutEffect, useMemo, useState} from "react"

export type TableDataSourceDefinition<T> = {
	getRowKey: (row: T, index: number) => string | number
	loadData: (opts: TableDataLoadOptions<T>) => TableDataLoadResult<T>

	/** Check if this row can theoretically have children.
	If true - user will be able to expand the row, at which point children will be loaded */
	canHaveChildren?: (row: T) => boolean

	/** Checks if the row can be moved to a new location. Defaults to true.
	Makes no sense to use without onRowDrag. */
	canMoveRowTo?: (dragEvent: TableRowMoveEvent<T>) => boolean
	/** Called when user completes drag-n-drop move of a row.
	Table expects that this handler will perform some operation on source data to move row from old position to new.
	Table data won't be re-fetched after operation is complete; instead, table will move the rows internally.
	(it doesn't matter if you're keeping source data in memory and not on server, as you'll have to update datasource anyway in this case)

	This handler can throw to indicate that operation is not successful; table will handle that.

	Keep in mind that moving rows around can cause weirdness when combined with other things, like sorting and pagination.
	It doesn't make much sense to drag-n-drop sorted rows, because order probably won't be saved (unless you update data in some smart way).
	It also can cause pagination-by-constraints to load wrong rows if a row is dragged to the last place.
	Table won't explicitly forbid those use cases, but you should be careful about them. */
	onRowMoved?: (dragEvent: TableRowMoveEvent<T>) => void | Promise<void>
}

export type TableRowMoveEvent<T> = {
	/** Location is a sequence of indices of children, from root to the last branch.
	It's like hierarchy, but without other info.
	Here hierarchies are not possible to use because sometimes we want to point to a row that doesn't exist yet (last one in sequence) */
	oldLocation: number[]
	newLocation: number[]
	/** Row that is being moved.
	Can be calculated both from oldLocation and newLocation; is present as separate field for convenience.

	(same goes for parent rows) */
	row: T
	oldParent: T | null
	newParent: T | null
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
const getTrue = () => true
const asyncNoop = async() => {
	// absolutely nothing!
}

/** Data source manages data loading for the table */
export type TableDataSource<T> = {
	getRowKey: (row: T, index: number) => string | number
	canHaveChildren: (row: T) => boolean
	loadNextRows: (hierarchy: TableHierarchy<T>) => Promise<{newRows: T[], isThereMore: boolean}>
	/** Can this data source ever return something meaningful for non-null parent? */
	isTreeDataSource: boolean
	areRowsMovable: boolean
	onRowMoved: (dragEvent: TableRowMoveEvent<T>) => Promise<void>
	canMoveRowTo: (dragEvent: TableRowMoveEvent<T>) => boolean
	cache: TableDataCache<T>
}


export const useTableDataSource = <T,>({
	loadData, getRowKey, canHaveChildren, onRowMoved, canMoveRowTo
}: TableDataSourceDefinition<T>): TableDataSource<T> => {

	const cache = useMemo(() => {
		return new TableDataCache<T>()
	}, [])

	const onRowMovedInternal = useMemo(() => {
		if(!onRowMoved){
			return asyncNoop
		}
		return async(evt: TableRowMoveEvent<T>) => {
			await Promise.resolve(onRowMoved(evt))
			cache.moveRow(evt.oldLocation, evt.newLocation)
		}
	}, [onRowMoved, cache])

	const loadNextRows = useCallback(async(hierarchy: TableHierarchy<T>) => {
		const knownRows = cache.getCachedChildren(hierarchy).rows
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
	}, [loadData, cache])

	return useMemo(() => ({
		getRowKey: getRowKey ?? getSecondParam,
		canHaveChildren: canHaveChildren ?? getFalse,
		loadNextRows,
		isTreeDataSource: !!canHaveChildren,
		cache,
		canMoveRowTo: canMoveRowTo ?? getTrue,
		areRowsMovable: !!onRowMoved,
		onRowMoved: onRowMovedInternal
	}), [getRowKey, canHaveChildren, loadNextRows, cache, canMoveRowTo, onRowMoved, onRowMovedInternal])
}

type TableSegmentDataProps<T> = {
	hierarchy: TableHierarchy<T>
	dataSource: TableDataSource<T>
}

export const useCachedTableSegmentData = <T,>({hierarchy, dataSource}: TableSegmentDataProps<T>) => {
	const {loadNextRows, cache} = dataSource

	const [segmentData, setSegmentData] = useState(() => cache.getCachedChildren(hierarchy).rows)

	// this is useLayoutEffect and not just useEffect because I'm afraid that first page load can happen faster than subscription
	// this can happen in theory in case of inmemory datasources
	useLayoutEffect(() => {
		cache.addSubscriber(hierarchy, setSegmentData)
		return () => {
			cache.removeSubscriber(hierarchy)
		}
	}, [hierarchy, cache])

	const loadMore = useCallback(async() => {
		const canLoadMore = cache.getCachedChildren(hierarchy).isThereMore
		if(!canLoadMore){
			return false
		}

		const {newRows, isThereMore} = await loadNextRows(hierarchy)
		const oldRows = cache.getCachedChildren(hierarchy).rows
		cache.setCachedChildren(hierarchy, [...oldRows, ...newRows], isThereMore)
		return isThereMore
	}, [loadNextRows, hierarchy, cache])

	return [segmentData, loadMore] as const
}
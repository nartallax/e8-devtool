import {TableHierarchy} from "client/components/table/table"
import {useCallback, useMemo, useRef, useState} from "react"

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
	oldLocation: TableHierarchy<T>
	newLocation: TableHierarchy<T>
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
const makeCacheKey = <T,>(getRowKey: TableDataSourceDefinition<T>["getRowKey"], hierarchy: TableHierarchy<T>): string => {
	const keySeq = hierarchy.map(entry => getRowKey(entry.row, entry.rowIndex))
	return JSON.stringify(keySeq)
}
const makeParentCacheKey = <T,>(getRowKey: TableDataSourceDefinition<T>["getRowKey"], hierarchy: TableHierarchy<T>): string => {
	return makeCacheKey(getRowKey, hierarchy.slice(0, hierarchy.length - 1))
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

const moveRowsInCache = <T,>(getRowKey: TableDataSourceDefinition<T>["getRowKey"], cache: Map<string, CacheEntry<T>>, event: TableRowMoveEvent<T>) => {
	const fromKey = makeParentCacheKey(getRowKey, event.oldLocation)
	const toKey = makeParentCacheKey(getRowKey, event.newLocation)
	const fromCacheEntry = cache.get(fromKey)
	const toCacheEntry = cache.get(toKey)
	if(!fromCacheEntry || !toCacheEntry){
		// never supposed to happen
		throw new Error(`No cache entry for either ${fromKey} or ${toKey} when drag-n-drop is finished.`)
	}
	let fromSeq = fromCacheEntry.rows
	let toSeq = toCacheEntry.rows

	const fromPath = event.oldLocation.map(x => x.rowIndex)
	let toPath = event.newLocation.map(x => x.rowIndex)
	toPath = updateMovePath(fromPath, toPath)
	const fromIndex = fromPath[fromPath.length - 1]!
	const toIndex = toPath[toPath.length - 1]!

	fromSeq = [...fromSeq.slice(0, fromIndex), ...fromSeq.slice(fromIndex + 1)]
	if(fromKey === toKey){
		toSeq = fromSeq
	}
	toSeq = [...toSeq.slice(0, toIndex), event.row, ...toSeq.slice(toIndex)]

	cache.set(toKey, {...toCacheEntry, rows: toSeq})
	toCacheEntry.setRows(toSeq)
	if(fromKey !== toKey){
		cache.set(fromKey, {...fromCacheEntry, rows: fromSeq})
		fromCacheEntry.setRows(fromSeq)
	}
}

const treePathToHierarchy = <T,>(getRowKey: TableDataSourceDefinition<T>["getRowKey"], cache: Map<string, CacheEntry<T>>, path: number[]): TableHierarchy<T> => {
	// this function is a bit unoptimal and could be better
	// but that's just how table cache works right now
	// if this ever becomes a problem - I'll have to rewrite this
	// (most obvious way would be to store tree cache as a tree and not as plain cache with composite keys)

	const hierarchy: TableHierarchy<T> = []
	while(hierarchy.length < path.length){
		const cacheEntry = cache.get(makeCacheKey(getRowKey, hierarchy))
		if(!cacheEntry){
			throw new Error("Failed to convert tree path to hierarchy: no cache entry for " + makeCacheKey(getRowKey, hierarchy))
		}

		const rowIndex = path[hierarchy.length]!
		if(cacheEntry.rows.length < rowIndex){
			throw new Error("Failed to convert tree path to hierarchy: cache entry for " + makeCacheKey(getRowKey, hierarchy) + " doesn't have enough rows.")
		}

		const row = cacheEntry.rows[rowIndex]!
		hierarchy.push({rowIndex, row, parentLoadedRowsCount: cacheEntry.rows.length})
	}
	return hierarchy
}

type CacheEntry<T> = {
	rows: T[]
	isThereMore: boolean
	setRows: (newRows: T[]) => void
}

/** Data source manages data loading for the table */
export type TableDataSource<T> = {
	getRowKey: (row: T, index: number) => string | number
	canHaveChildren: (row: T) => boolean
	loadNextRows: (hierarchy: TableHierarchy<T>, knownRows: T[]) => Promise<{newRows: T[], isThereMore: boolean}>
	/** Can this data source ever return something meaningful for non-null parent? */
	isTreeDataSource: boolean
	areRowsMovable: boolean
	onRowMoved: (dragEvent: TableRowMoveEvent<T>) => Promise<void>
	canMoveRowTo: (dragEvent: TableRowMoveEvent<T>) => boolean
	treePathToHierarchy: (treePath: number[]) => TableHierarchy<T>
	// TODO: this sucks, cacheing hierarchical data in flat structure doesn't work in multiple ways
	cache: Map<string, CacheEntry<T>>
}


export const useTableDataSource = <T,>({
	loadData, getRowKey, canHaveChildren, onRowMoved, canMoveRowTo
}: TableDataSourceDefinition<T>): TableDataSource<T> => {

	const cache = useMemo(() => {
		void getRowKey // just to make sure it will flush every time key fn changes
		return new Map<string, CacheEntry<T>>()
	}, [getRowKey])

	const onRowMovedInternal = useMemo(() => {
		if(!onRowMoved){
			return asyncNoop
		}
		return async(evt: TableRowMoveEvent<T>) => {
			await Promise.resolve(onRowMoved(evt))
			moveRowsInCache(getRowKey, cache, evt)
		}
	}, [onRowMoved, getRowKey, cache])

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

	const _treePathToHierarchy = useCallback((treePath: number[]) => treePathToHierarchy(getRowKey, cache, treePath), [getRowKey, cache])

	return useMemo(() => ({
		getRowKey: getRowKey ?? getSecondParam,
		canHaveChildren: canHaveChildren ?? getFalse,
		loadNextRows,
		isTreeDataSource: !!canHaveChildren,
		cache,
		canMoveRowTo: canMoveRowTo ?? getTrue,
		areRowsMovable: !!onRowMoved,
		onRowMoved: onRowMovedInternal,
		treePathToHierarchy: _treePathToHierarchy
	}), [getRowKey, canHaveChildren, loadNextRows, cache, canMoveRowTo, onRowMoved, onRowMovedInternal, _treePathToHierarchy])
}

type TableSegmentDataProps<T> = {
	hierarchy: TableHierarchy<T>
	dataSource: TableDataSource<T>
}

export const useCachedTableSegmentData = <T,>({hierarchy, dataSource}: TableSegmentDataProps<T>) => {
	const {getRowKey, loadNextRows, cache} = dataSource
	const key = useMemo(() => makeCacheKey(getRowKey, hierarchy), [getRowKey, hierarchy])

	const [segmentData, setSegmentData] = useState(() => cache.get(key)?.rows ?? [])
	const segmentDataRef = useRef(segmentData)
	segmentDataRef.current = segmentData

	const loadMore = useCallback(async() => {
		const canLoadMore = cache.get(key)?.isThereMore ?? true
		if(!canLoadMore){
			return false
		}

		const {newRows, isThereMore} = await loadNextRows(hierarchy, segmentDataRef.current)
		setSegmentData(oldRows => {
			const newSegmentData = [...oldRows, ...newRows]
			cache.set(key, {rows: newSegmentData, isThereMore, setRows: setSegmentData})
			return newSegmentData
		})
		return isThereMore
	}, [loadNextRows, hierarchy, cache, key])

	return [segmentData, loadMore] as const
}
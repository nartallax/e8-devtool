import {Forest, Tree} from "@nartallax/forest"
import {TableBottomHitEvent} from "client/components/table/table"
import {TableSettings} from "client/components/table/table_settings"
import {SetState} from "client/ui_utils/react_types"
import {useRefValue} from "common/ref_value"
import {useCallback, useEffect, useMemo, useRef, useState} from "react"

type Props<S, P, T> = {
	settings: TableSettings<T>
	/** Get initial state of data. It's probably empty array, or something similar. */
	getBlank: () => S
	/** Convert state to rows. */
	getRows: (state: S) => readonly T[]
	/** Load next page, as described by event. */
	loadPage: (evt: TableBottomHitEvent<T>) => P | null | undefined | Promise<P | null | undefined>
	/** Add loaded page to the state.
	Not every loaded page is appended;
	sometimes the page is discarded if something happened to table settings during loading */
	appendPage: (evt: TableBottomHitEvent<T>, page: P, state: S) => S
}

type TableLoader<S, T> = {
	rows: readonly T[]
	refresh: () => void
	onBottomHit: (evt: TableBottomHitEvent<T>) => Promise<void>
	/** This should be used with care, as it can cause errors if called while page is being fetched.
	If you need to reload whole table data - prefer `.refresh()` */
	setTableData: SetState<S>
}

/** A loader for table data.
Table can be used without this loader in simple cases;
however, if you want to have lazy-loading of rows and also user-changeable table settings,
you should use this hook, because it can help avoid certain bugs.

This loader is as generic as possible;
you probably want to make another hook on top of it with more concise interface. */
export const useTableDataLoader = <S, P, T>({
	settings, getBlank, getRows, loadPage, appendPage
}: Props<S, P, T>): TableLoader<S, T> => {
	const getBlankRef = useRefValue(getBlank)
	const getRowsRef = useRefValue(getRows)
	const loadPageRef = useRefValue(loadPage)
	const appendPageRef = useRefValue(appendPage)

	const [state, setState] = useState(getBlank())

	const revision = useRef(1)

	const onBottomHit = useCallback(async(evt: TableBottomHitEvent<T>) => {
		const loadingStartRevision = revision.current
		const page = await Promise.resolve(loadPageRef.current(evt))
		setState(state => {
			if(loadingStartRevision !== revision.current){
				return state // throwing away page that is obsolete at this point
			}
			if(page === null || page === undefined){
				return state
			}
			return appendPageRef.current(evt, page, state)
		})
	}, [loadPageRef, appendPageRef])

	const refresh = useCallback(() => {
		revision.current++
		setState(getBlankRef.current())
	}, [getBlankRef])

	const {order} = settings
	useEffect(() => () => {
		refresh()
	}, [order, refresh])

	return {
		refresh,
		rows: useMemo(() => getRowsRef.current(state), [getRowsRef, state]),
		setTableData: setState,
		onBottomHit
	}
}


type TreeTableLoaderProps<T, B> = Pick<Props<Forest<T, B>, readonly Tree<T, B>[], Tree<T, B>>, "settings" | "loadPage">
export const useTreeTableDataLoader = <T, B>({settings, loadPage}: TreeTableLoaderProps<T, B>): TableLoader<Forest<T, B>, Tree<T, B>> => {
	return useTableDataLoader<Forest<T, B>, readonly Tree<T, B>[], Tree<T, B>>({
		getBlank: () => new Forest<T, B>([]),
		appendPage: (evt, page, state) => {
			if(page.length === 0){
				return state
			}
			const treePath = evt.hierarchy.map(x => x.rowIndex)
			treePath.push(evt.knownRows.length)
			return state.insertTreesAt(treePath, page)
		},
		loadPage,
		getRows: forest => forest.trees,
		settings
	})
}
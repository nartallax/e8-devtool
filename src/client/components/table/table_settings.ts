import {TableColumnDefinition, TableUserConfigActionProps} from "client/components/table/table"
import {TableOrder, TableOrderDirection} from "client/components/table/table_data_source"
import {SetState} from "client/ui_utils/react_types"
import {useTransformedSetState, useWrappedSetState} from "client/ui_utils/use_wrapped_setstate"
import {useCallback, useMemo, useState} from "react"

type Props<T> = Partial<TableUserConfigActionProps> & {
	columns: readonly TableColumnDefinition<T>[]
}

type TableSettings<T> = {
	/** Column definitions ordered in a way user ordered them */
	orderedColumns: readonly TableColumnDefinition<T>[]
	swapColumn: (id: string, direction: -1 | 1) => void
	order: readonly TableOrder<T>[]
	userConfigActions: TableUserConfigActionProps
	setOrder: SetState<readonly TableOrder<T>[]>
	columnWidthOverrides: ReadonlyMap<string, number>
	setColumnWidthOverrides: SetState<TableSettings<T>["columnWidthOverrides"]>
}

export const getTableTemplateColumns = <T>(columns: readonly TableColumnDefinition<T>[], overrides: ReadonlyMap<string, number>): string => {
	return columns.map(col => {
		const override = overrides.get(col.id)
		if(override !== undefined){
			return override + "px"
		} else {
			return col.width ?? "auto"
		}
	}).join(" ")
}

type LocalStorageState = {
	order: {columnId: string, direction: TableOrderDirection}[]
	columnOrder: {columnId: string}[]
	columnWidthOverrides: {columnId: string, width: number}[]
}

const getLocalStorageKey = (id: string) => `table_settings[${id}]`

const loadStateFromLocalStorage = <T>(id: string | null, columns: readonly TableColumnDefinition<T>[]): LocalStorageState => {
	const emptyState: LocalStorageState = {
		order: tableOrderToStorageOrder(getDefaultOrder(columns)),
		columnOrder: columns.map(x => ({columnId: x.id})),
		columnWidthOverrides: []
	}
	if(!id){
		return emptyState
	}

	const str = localStorage.getItem(getLocalStorageKey(id))
	let state: LocalStorageState = {
		...emptyState,
		...JSON.parse(str ?? "{}")
	}
	const knownColIds = new Set(columns.map(col => col.id))
	state = Object.fromEntries(Object.entries(state).map(([k, arr]) => {
		return [k, arr.filter(x => knownColIds.has(x.columnId))]
	})) as LocalStorageState

	const columnsInOrder = new Set(state.columnOrder.map(col => col.columnId))
	for(let i = 0; i < columns.length; i++){
		const col = columns[i]!
		if(!columnsInOrder.has(col.id)){
			state.columnOrder = [
				...state.columnOrder.slice(0, i),
				{columnId: col.id},
				...state.columnOrder.slice(i)
			]
		}
	}

	return state
}

const saveStateToLocalStorage = (id: string | null, state: LocalStorageState) => {
	if(!id){
		return
	}

	localStorage.setItem(getLocalStorageKey(id), JSON.stringify(state))
}

const getDefaultOrder = <T>(columns: readonly TableColumnDefinition<T>[]) => {
	const defaultOrderedColumns = columns
		.filter(col => !!col.defaultOrder)
		.sort((a, b) => {
			const aPriority = Array.isArray(a.defaultOrder) ? a.defaultOrder[0] : 0
			const bPriority = Array.isArray(b.defaultOrder) ? b.defaultOrder[0] : 0
			return aPriority > bPriority ? -1 : aPriority < bPriority ? 1 : a.id < b.id ? -1 : 1
		})
	return defaultOrderedColumns.map(column => ({
		column,
		direction: Array.isArray(column.defaultOrder) ? column.defaultOrder[1] : column.defaultOrder!
	}))
}

const storageOrderToTableOrder = <T>(ord: LocalStorageState["order"], columns: readonly TableColumnDefinition<T>[]): TableOrder<T>[] => {
	const map = new Map(columns.map(col => [col.id, col]))
	return ord.map(ord => ({direction: ord.direction, column: map.get(ord.columnId)!}))
}

const tableOrderToStorageOrder = <T>(ord: readonly TableOrder<T>[]): LocalStorageState["order"] => {
	return ord.map(ord => ({columnId: ord.column.id, direction: ord.direction}))
}

export const useTableSettings = <T>({
	columns, maxOrderedColumns, areColumnsOrderable, areColumnsSwappable, areColumnsResizeable, defaultMinColumnWidth, localStorageId
}: Props<T>): TableSettings<T> => {

	const userConfigActions: TableUserConfigActionProps = useMemo(() => {
		const defaultOrderedColumns = columns.filter(col => !!col.defaultOrder).length
		return {
			maxOrderedColumns: maxOrderedColumns ?? Math.max(defaultOrderedColumns, 1),
			areColumnsOrderable: areColumnsOrderable ?? false,
			areColumnsSwappable: areColumnsSwappable ?? false,
			areColumnsResizeable: areColumnsResizeable ?? false,
			defaultMinColumnWidth: defaultMinColumnWidth ?? 50,
			localStorageId: localStorageId ?? null
		}
	}, [maxOrderedColumns, areColumnsOrderable, areColumnsSwappable, areColumnsResizeable, columns, defaultMinColumnWidth, localStorageId])

	const [localStorageState, _setLocalStorageState] = useState(() => loadStateFromLocalStorage(localStorageId ?? null, columns))
	const setLocalStorageState = useWrappedSetState(_setLocalStorageState,
		(value: LocalStorageState) => {
			saveStateToLocalStorage(localStorageId ?? null, value)
		}
	)

	const setOrder = useTransformedSetState(setLocalStorageState,
		(order: readonly TableOrder<T>[], state) => ({
			...state,
			order: tableOrderToStorageOrder(order)
		}),
		state => storageOrderToTableOrder(state.order, columns)
	)

	const swapColumn = useCallback((id: string, direction: -1 | 1) => {
		setLocalStorageState(state => {
			const index = state.columnOrder.findIndex(col => col.columnId === id)
			const newIndex = index + direction
			if(newIndex >= 0 && newIndex < state.columnOrder.length){
				const newCols = [...state.columnOrder]
				const col = newCols[index]!
				newCols[index] = newCols[newIndex]!
				newCols[newIndex] = col
				state = {
					...state,
					columnOrder: newCols
				}
			}
			return state
		})
	}, [setLocalStorageState])

	const orderedColumns = useMemo(() => {
		const colById = new Map(columns.map(col => [col.id, col]))
		return localStorageState.columnOrder.map(({columnId}) => colById.get(columnId)!)
	}, [columns, localStorageState.columnOrder])

	const setColumnWidthOverrides = useTransformedSetState(setLocalStorageState,
		(map: ReadonlyMap<string, number>, state) => ({
			...state,
			columnWidthOverrides: [...map.entries()].map(([columnId, width]) => ({columnId, width}))
		}),
		state => new Map(state.columnWidthOverrides.map(x => [x.columnId, x.width]))
	)

	return {
		orderedColumns,
		order: useMemo(
			() => storageOrderToTableOrder(localStorageState.order, columns),
			[localStorageState.order, columns]
		),
		setOrder,
		userConfigActions,
		swapColumn,
		columnWidthOverrides: useMemo(
			() => new Map(localStorageState.columnWidthOverrides.map(x => [x.columnId, x.width])),
			[localStorageState.columnWidthOverrides]
		),
		setColumnWidthOverrides
	}
}
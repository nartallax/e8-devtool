import {TableColumnDefinition, TableOrder, TableOrderDirection, TableUserConfigActionProps} from "client/components/table/table"
import {SetState} from "client/ui_utils/react_types"
import {useTransformedSetState, useWrappedSetState} from "client/ui_utils/use_wrapped_setstate"
import {useCallback, useMemo, useState} from "react"

type Props<T> = Partial<TableUserConfigActionProps> & {
	columns: readonly TableColumnDefinition<T>[]
}

type TableSettings<T> = {
	readonly userConfigActions: TableUserConfigActionProps
	/** Column definitions ordered in a way user ordered them */
	readonly orderedColumns: readonly TableColumnDefinition<T>[]
	readonly swapColumn: (id: string, direction: -1 | 1) => void

	readonly order: readonly TableOrder<T>[]
	readonly setOrder: SetState<readonly TableOrder<T>[]>

	readonly columnWidthOverrides: ReadonlyMap<string, number>
	readonly setColumnWidthOverrides: SetState<TableSettings<T>["columnWidthOverrides"]>
}

export const getTableTemplateColumns = <T>(orderedColumns: readonly TableColumnDefinition<T>[], overrides: ReadonlyMap<string, number>): string => {
	return orderedColumns.map(column => {
		const override = overrides.get(column.id)
		if(override !== undefined){
			return override + "px"
		} else {
			return column.width ?? "auto"
		}
	}).join(" ")
}

type LocalStorageState = {
	readonly order: readonly {columnId: string, direction: TableOrderDirection}[]
	readonly columnOrder: readonly {columnId: string}[]
	readonly columnWidthOverrides: readonly {columnId: string, width: number}[]
}

const getLocalStorageKey = (id: string) => `table_settings[${id}]`

const storageOrderToTableOrder = <T>(order: LocalStorageState["order"], columns: readonly TableColumnDefinition<T>[]): TableOrder<T>[] => {
	return order.map(order => {
		const col = columns.find(col => col.id === order.columnId)
		if(!col){
			return null
		}
		return {column: col, direction: order.direction}
	}).filter(order => order !== null)
}

const tableOrderToStorageOrder = <T>(order: readonly TableOrder<T>[]): LocalStorageState["order"] => {
	return order.map(({column, direction}) => ({columnId: column.id, direction}))
}

const loadStateFromLocalStorage = <T>(id: string | null, columns: readonly TableColumnDefinition<T>[]): LocalStorageState => {
	const emptyState: LocalStorageState = {
		order: tableOrderToStorageOrder(getDefaultOrder(columns)),
		columnOrder: columns.map(column => ({columnId: column.id})),
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
	const knownColIds = new Set(columns.map(column => column.id))
	state = Object.fromEntries(Object.entries(state).map(([k, arr]) => {
		return [k, arr.filter(x => knownColIds.has(x.columnId))]
	})) as unknown as LocalStorageState

	state = addMissingColumnsToOrder(state, columns)

	return state
}

// this can happen in case of new columns being added in code
const addMissingColumnsToOrder = <T>(state: LocalStorageState, columns: readonly TableColumnDefinition<T>[]): LocalStorageState => {
	const columnsInOrder = new Set(state.columnOrder.map(col => col.columnId))
	const colIds = columns.map(column => column.id)
	for(let i = 0; i < colIds.length; i++){
		const colId = colIds[i]!
		if(!columnsInOrder.has(colId)){
			state = {
				...state,
				columnOrder: [
					...state.columnOrder.slice(0, i),
					{columnId: colId},
					...state.columnOrder.slice(i)
				]
			}
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

const getDefaultOrder = <T>(columns: readonly TableColumnDefinition<T>[]): TableOrder<T>[] => {
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
		state => storageOrderToTableOrder(state.order, columns))

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
		const map = new Map(columns.map(col => [col.id, col]))
		return localStorageState.columnOrder.map(({columnId}) => map.get(columnId)!)
	}, [localStorageState.columnOrder, columns])

	const setColumnWidthOverrides = useTransformedSetState(setLocalStorageState,
		(map: ReadonlyMap<string, number>, state) => ({
			...state,
			columnWidthOverrides: [...map.entries()].map(([columnId, width]) => ({columnId, width}))
		}),
		state => new Map(state.columnWidthOverrides.map(x => [x.columnId, x.width]))
	)

	return {
		orderedColumns,
		order: useMemo(() => storageOrderToTableOrder(localStorageState.order, columns), [localStorageState.order, columns]),
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
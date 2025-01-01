import {TableColumnDefinition, TableOrder, TableOrderDirection} from "client/components/table/table"
import {SetState} from "client/ui_utils/react_types"
import {useSyntheticSetState} from "client/ui_utils/use_wrapped_setstate"
import {useMemo, useState} from "react"

type Props<T> = {
	columns: readonly TableColumnDefinition<T>[]
	/** Top limit for amount of simultaneously ordered columns.
	If not passed - will be equal to amount of default-oredered columns, or 1 if there are none. */
	maxOrderedColumns?: number
	/** If true, by default user will be able to change order of any column */
	areColumnsOrderable?: boolean
	/** If true, by default user will be able to swap columns' position */
	areColumnsSwappable?: boolean
	/** If true, by default user will be able to resize columns */
	areColumnsResizeable?: boolean
	/** Pixel size of min column width. Active during resizing. */
	defaultMinColumnWidth?: number
	/** Part of local storage key. If passed, all configurable settings (width, position...) will be stored there. */
	localStorageId?: string | null
}

type CounterPartial<T> = {[k in keyof T]-?: Exclude<T[k], undefined>}
export type TableUserActionConfig = CounterPartial<Omit<Props<unknown>, "columns" | "localStorageId">>

export type TableSettings<T> = {
	readonly userActionConfig: TableUserActionConfig
	readonly columns: readonly TableColumnDefinition<T>[]
	/** Column definitions ordered in a way user ordered them */
	readonly orderedColumns: readonly TableColumnDefinition<T>[]
	readonly order: readonly TableOrder<T>[]
	readonly columnWidthOverrides: ReadonlyMap<string, number>
}
// You're not supposed to change .columns or .userActionConfig properties through setSettings().
// It can only be done by passing new values into useTableSettings().
export type MutableTableSettings<T> = Omit<TableSettings<T>, "columns" | "userActionConfig">

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
}: Props<T>): [TableSettings<T>, SetState<MutableTableSettings<T>>] => {

	const userActionConfig: TableUserActionConfig = useMemo(() => {
		const defaultOrderedColumns = columns.filter(col => !!col.defaultOrder).length
		return {
			maxOrderedColumns: maxOrderedColumns ?? Math.max(defaultOrderedColumns, 1),
			areColumnsOrderable: areColumnsOrderable ?? false,
			areColumnsSwappable: areColumnsSwappable ?? false,
			areColumnsResizeable: areColumnsResizeable ?? false,
			defaultMinColumnWidth: defaultMinColumnWidth ?? 50
		}
	}, [maxOrderedColumns, areColumnsOrderable, areColumnsSwappable, areColumnsResizeable, columns, defaultMinColumnWidth])

	const [localStorageState, setLocalStorageState] = useState(() => loadStateFromLocalStorage(localStorageId ?? null, columns))

	const mutableSettings = useMemo<MutableTableSettings<T>>(() => {
		const map = new Map(columns.map(col => [col.id, col]))
		return ({
			columnWidthOverrides: new Map(localStorageState.columnWidthOverrides.map(x => [x.columnId, x.width])),
			order: storageOrderToTableOrder(localStorageState.order, columns),
			orderedColumns: localStorageState.columnOrder.map(({columnId}) => map.get(columnId)!)
		})
	}, [columns, localStorageState])

	const setMutableSettings = useSyntheticSetState(mutableSettings, settings => {
		const lsState: LocalStorageState = {
			columnOrder: settings.orderedColumns.map(col => ({columnId: col.id})),
			columnWidthOverrides: [...settings.columnWidthOverrides.entries()].map(([columnId, width]) => ({columnId, width})),
			order: tableOrderToStorageOrder(settings.order)
		}
		setLocalStorageState(lsState)
		saveStateToLocalStorage(localStorageId ?? null, lsState)
	})

	const settings = useMemo<TableSettings<T>>(() => ({
		...mutableSettings, userActionConfig, columns
	}), [mutableSettings, userActionConfig, columns])

	return [settings, setMutableSettings]
}
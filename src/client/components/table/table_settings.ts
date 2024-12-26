import {TableColumnDefinitions, TableOrder, TableOrderDirection, TableUserConfigActionProps} from "client/components/table/table"
import {TableUtils} from "client/components/table/table_utils"
import {SetState} from "client/ui_utils/react_types"
import {useTransformedSetState, useWrappedSetState} from "client/ui_utils/use_wrapped_setstate"
import {useCallback, useMemo, useState} from "react"

type Props<K extends string> = Partial<TableUserConfigActionProps> & {
	columns: TableColumnDefinitions<K>
}

type TableSettings<K extends string> = {
	/** Column definitions ordered in a way user ordered them */
	readonly orderedColumnIds: readonly K[]
	readonly swapColumn: (id: string, direction: -1 | 1) => void
	readonly order: readonly TableOrder<K>[]
	readonly userConfigActions: TableUserConfigActionProps
	readonly setOrder: SetState<readonly TableOrder<K>[]>
	readonly columnWidthOverrides: ReadonlyMap<K, number>
	readonly setColumnWidthOverrides: SetState<TableSettings<K>["columnWidthOverrides"]>
}

export const getTableTemplateColumns = <K extends string>(order: readonly K[], columns: TableColumnDefinitions<K>, overrides: ReadonlyMap<string, number>): string => {
	return order.map(id => {
		const override = overrides.get(id)
		if(override !== undefined){
			return override + "px"
		} else {
			return columns[id].width ?? "auto"
		}
	}).join(" ")
}

type LocalStorageState<K extends string> = {
	readonly order: readonly {columnId: K, direction: TableOrderDirection}[]
	readonly columnOrder: readonly {columnId: K}[]
	readonly columnWidthOverrides: readonly {columnId: K, width: number}[]
}

const getLocalStorageKey = (id: string) => `table_settings[${id}]`

const loadStateFromLocalStorage = <K extends string>(id: string | null, columns: TableColumnDefinitions<K>): LocalStorageState<K> => {
	const emptyState: LocalStorageState<K> = {
		order: getDefaultOrder(columns),
		columnOrder: TableUtils.colIds(columns).map(columnId => ({columnId})),
		columnWidthOverrides: []
	}
	if(!id){
		return emptyState
	}

	const str = localStorage.getItem(getLocalStorageKey(id))
	let state: LocalStorageState<K> = {
		...emptyState,
		...JSON.parse(str ?? "{}")
	}
	const knownColIds = new Set(TableUtils.colIds(columns))
	state = Object.fromEntries(Object.entries(state).map(([k, arr]) => {
		return [k, arr.filter(x => knownColIds.has(x.columnId))]
	})) as unknown as LocalStorageState<K>

	const columnsInOrder = new Set(state.columnOrder.map(col => col.columnId))
	const colIds = TableUtils.colIds(columns)
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

const saveStateToLocalStorage = <K extends string>(id: string | null, state: LocalStorageState<K>) => {
	if(!id){
		return
	}

	localStorage.setItem(getLocalStorageKey(id), JSON.stringify(state))
}

const getDefaultOrder = <K extends string>(columns: TableColumnDefinitions<K>): TableOrder<K>[] => {
	const defaultOrderedColumns = TableUtils.colEntries(columns)
		.filter(([,col]) => !!col.defaultOrder)
		.sort(([aId, a], [bId, b]) => {
			const aPriority = Array.isArray(a.defaultOrder) ? a.defaultOrder[0] : 0
			const bPriority = Array.isArray(b.defaultOrder) ? b.defaultOrder[0] : 0
			return aPriority > bPriority ? -1 : aPriority < bPriority ? 1 : aId < bId ? -1 : 1
		})
	return defaultOrderedColumns.map(([id, column]) => ({
		columnId: id,
		direction: Array.isArray(column.defaultOrder) ? column.defaultOrder[1] : column.defaultOrder!
	}))
}

export const useTableSettings = <K extends string>({
	columns, maxOrderedColumns, areColumnsOrderable, areColumnsSwappable, areColumnsResizeable, defaultMinColumnWidth, localStorageId
}: Props<K>): TableSettings<K> => {

	const userConfigActions: TableUserConfigActionProps = useMemo(() => {
		const defaultOrderedColumns = TableUtils.colDefs(columns).filter(col => !!col.defaultOrder).length
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
		(value: LocalStorageState<K>) => {
			saveStateToLocalStorage(localStorageId ?? null, value)
		}
	)

	const setOrder = useTransformedSetState(setLocalStorageState,
		(order: readonly TableOrder<K>[], state) => ({
			...state,
			order
		}),
		state => state.order)

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

	const orderedColumnIds = useMemo(() => {
		return localStorageState.columnOrder.map(({columnId}) => columnId)
	}, [localStorageState.columnOrder])

	const setColumnWidthOverrides = useTransformedSetState(setLocalStorageState,
		(map: ReadonlyMap<K, number>, state) => ({
			...state,
			columnWidthOverrides: [...map.entries()].map(([columnId, width]) => ({columnId, width}))
		}),
		state => new Map(state.columnWidthOverrides.map(x => [x.columnId, x.width]))
	)

	return {
		orderedColumnIds,
		order: localStorageState.order,
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
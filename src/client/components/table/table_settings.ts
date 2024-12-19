import {TableColumnDefinition, TableUserConfigActionProps} from "client/components/table/table"
import {TableOrder} from "client/components/table/table_data_source"
import {SetState} from "client/ui_utils/react_types"
import {useCallback, useMemo, useState} from "react"

type Props<T> = Partial<TableUserConfigActionProps> & {
	columns: TableColumnDefinition<T>[]
}

type TableSettings<T> = {
	/** Column definitions ordered in a way user ordered them */
	orderedColumns: TableColumnDefinition<T>[]
	swapColumn: (id: string, direction: -1 | 1) => void
	order: TableOrder<T>[]
	userConfigActions: TableUserConfigActionProps
	setOrder: SetState<TableOrder<T>[]>
}

export const useTableSettings = <T>({
	columns, maxOrderedColumns, areColumnsOrderable, areColumnsSwappable
}: Props<T>): TableSettings<T> => {

	const userConfigActions: TableUserConfigActionProps = useMemo(() => {
		const defaultOrderedColumns = columns.filter(col => !!col.defaultOrder).length
		return {
			maxOrderedColumns: maxOrderedColumns ?? Math.max(defaultOrderedColumns, 1),
			areColumnsOrderable: areColumnsOrderable ?? false,
			areColumnsSwappable: areColumnsSwappable ?? false
		}
	}, [maxOrderedColumns, areColumnsOrderable, areColumnsSwappable, columns])

	const [ordering, setOrdering] = useState<TableOrder<T>[]>(() => {
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
	})

	const [orderedColumns, setOrderedColumns] = useState(columns)
	const swapColumn = useCallback((id: string, direction: -1 | 1) => {
		setOrderedColumns(columns => {
			const index = columns.findIndex(col => col.id === id)
			const newIndex = index + direction
			if(newIndex < 0 || newIndex >= columns.length){
				return columns
			}
			const newCols = [...columns]
			const col = newCols[index]!
			newCols[index] = newCols[newIndex]!
			newCols[newIndex] = col
			return newCols
		})
	}, [])


	return {
		orderedColumns: orderedColumns,
		order: ordering,
		setOrder: setOrdering,
		userConfigActions,
		swapColumn
	}
}
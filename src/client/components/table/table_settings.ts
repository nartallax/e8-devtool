import {TableColumnDefinition, TableUserConfigActionProps} from "client/components/table/table"
import {TableOrder} from "client/components/table/table_data_source"
import {SetState} from "client/ui_utils/react_types"
import {useMemo, useState} from "react"

type Props<T> = Partial<TableUserConfigActionProps> & {
	columns: TableColumnDefinition<T>[]
}

type TableSettings<T> = {
	/** Column definitions ordered in a way user ordered them */
	orderedColumns: TableColumnDefinition<T>[]
	order: TableOrder<T>[]
	userConfigActions: TableUserConfigActionProps
	setOrder: SetState<TableOrder<T>[]>
}

export const useTableSettings = <T>({columns, maxOrderedColumns, areColumnsOrderable}: Props<T>): TableSettings<T> => {

	const userConfigActions: TableUserConfigActionProps = useMemo(() => {
		const defaultOrderedColumns = columns.filter(col => !!col.defaultOrder).length
		return {
			maxOrderedColumns: maxOrderedColumns ?? Math.max(defaultOrderedColumns, 1),
			areColumnsOrderable: areColumnsOrderable ?? false
		}
	}, [maxOrderedColumns, areColumnsOrderable, columns])

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

	return {
		orderedColumns: columns,
		order: ordering,
		setOrder: setOrdering,
		userConfigActions
	}
}
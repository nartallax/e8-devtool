import {TableColumnDefinition, TableUserConfigActionProps} from "client/components/table/table"
import {TableOrder} from "client/components/table/table_data_source"
import {SetState} from "client/ui_utils/react_types"
import * as css from "./table.module.css"
import {cn} from "client/ui_utils/classname"
import {useMemo} from "react"
import {Icon} from "generated/icons"

type Props<T> = {
	columns: TableColumnDefinition<T>[]
	order: TableOrder<T>[]
	setOrder: SetState<TableOrder<T>[]>
	userConfigActions: TableUserConfigActionProps
}

export const TableHeader = <T,>({
	columns, order, setOrder, userConfigActions
}: Props<T>) => {

	const orderByCol = useMemo(() => {
		return new Map(order.map((order, index) => [order.column.id, {direction: order.direction, index}]))
	}, [order])

	const changeColumnOrder = (column: TableColumnDefinition<T>) => {
		setOrder(orders => {
			const oldDirection = orderByCol.get(column.id)?.direction
			const newDirection = !oldDirection ? "asc" : oldDirection === "asc" ? "desc" : null
			let newOrders = orders.filter(order => order.column.id !== column.id)
			if(newDirection){
				newOrders = [
					{column, direction: newDirection},
					...newOrders
				]
			}
			if(newOrders.length > userConfigActions.maxOrderedColumns){
				newOrders = newOrders.slice(0, userConfigActions.maxOrderedColumns)
			}
			return newOrders
		})
	}

	return columns.map(col => {
		const order = orderByCol.get(col.id)
		const orderIndex = !order || userConfigActions.maxOrderedColumns < 2 ? null : order.index
		const isOrderUserChangeable = col.isOrderUserChangeable ?? userConfigActions.areColumnsOrderable
		return (
			<div
				className={cn(css.tableHeader, {
					[css.isOrderable!]: isOrderUserChangeable
				})}
				key={col.id}
				style={{
					gridColumn: `var(--table-col-${col.id})`
				}}
				onClick={!isOrderUserChangeable ? undefined : () => {
					changeColumnOrder(col)
				}}>
				<div className={css.headerContent}>
					{col.header}
				</div>
				{order && <div
					className={cn(css.headerIcon, css.orderHeaderIcon, {
						[Icon.chevronUp]: order?.direction === "asc",
						[Icon.chevronDown]: order?.direction === "desc"
					})}>
					{orderIndex !== null && <div className={css.orderHeaderIconText}>{orderIndex + 1}</div>}
				</div>}
			</div>
		)
	})
}
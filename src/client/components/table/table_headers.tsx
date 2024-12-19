import {TableColumnDefinition, TableUserConfigActionProps} from "client/components/table/table"
import {TableOrder, TableOrderDirection} from "client/components/table/table_data_source"
import {SetState} from "client/ui_utils/react_types"
import * as css from "./table.module.css"
import {cn} from "client/ui_utils/classname"
import {useCallback, useMemo} from "react"
import {Icon} from "generated/icons"
import {reactMemo} from "common/react_memo"

type Props<T> = {
	columns: TableColumnDefinition<T>[]
	order: TableOrder<T>[]
	setOrder: SetState<TableOrder<T>[]>
	userConfigActions: TableUserConfigActionProps
	swapColumn: (id: string, direction: -1 | 1) => void
}

export const TableHeaders = reactMemo(<T,>({
	columns, order, setOrder, userConfigActions, swapColumn
}: Props<T>) => {

	const changeColumnOrder = useCallback((column: TableColumnDefinition<T>) => {
		setOrder(orders => {
			const oldDirection = orders.find(order => order.column.id === column.id)?.direction
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
	}, [userConfigActions, setOrder])

	return columns.map(col => {
		const colOrder = order.find(order => order.column.id === col.id)
		const orderIndex = !colOrder || userConfigActions.maxOrderedColumns < 2 ? null : order.indexOf(colOrder)
		return (
			<TableHeader
				key={col.id}
				column={col}
				userConfigActions={userConfigActions}
				orderDirection={colOrder?.direction ?? null}
				orderIndex={orderIndex}
				onOrderChange={changeColumnOrder}
				swapColumn={swapColumn}
			/>
		)
	})
})


type SingleHeaderProps<T> = {
	column: TableColumnDefinition<T>
	orderDirection: TableOrderDirection | null
	orderIndex: number | null
	userConfigActions: TableUserConfigActionProps
	onOrderChange: (column: TableColumnDefinition<T>) => void
	swapColumn: (id: string, direction: -1 | 1) => void
}

const TableHeader = reactMemo(<T,>({
	column, orderDirection, orderIndex, onOrderChange, swapColumn, userConfigActions
}: SingleHeaderProps<T>) => {

	const handlerProps = useMemo(() => {
		const isOrderUserChangeable = column.isOrderUserChangeable ?? userConfigActions.areColumnsOrderable
		const isSwappable = column.isSwappable ?? userConfigActions.areColumnsSwappable
		const className = cn(css.tableHeader, {
			[css.isInteractive!]: isOrderUserChangeable || isSwappable
		})

		let onClick: (() => void) | null = null
		if(isOrderUserChangeable){
			onClick = () => {
				onOrderChange(column)
			}
		}

		const onDown: (() => void) | null = null
		if(isSwappable){
			void swapColumn // TBD
		}

		return {
			className,
			...(onDown ? {onDown} : onClick ? {onClick} : {})
		}
	}, [column, onOrderChange, swapColumn, userConfigActions])

	return (
		<div
			data-column-id={column.id}
			style={{
				gridColumn: `var(--table-col-${column.id})`
			}}
			{...handlerProps}>
			<div className={css.headerContent}>
				{column.header}
			</div>
			{orderDirection && <div
				className={cn(css.headerIcon, css.orderHeaderIcon, {
					[Icon.chevronUp]: orderDirection === "asc",
					[Icon.chevronDown]: orderDirection === "desc"
				})}>
				{orderIndex !== null && <div className={css.orderHeaderIconText}>{orderIndex + 1}</div>}
			</div>}
		</div>
	)
})
import {TableColumnDefinition, TableUserConfigActionProps} from "client/components/table/table"
import {TableOrder, TableOrderDirection} from "client/components/table/table_data_source"
import {SetState} from "client/ui_utils/react_types"
import * as css from "./table.module.css"
import {cn} from "client/ui_utils/classname"
import {useCallback, useMemo, useState} from "react"
import {Icon} from "generated/icons"
import {reactMemo} from "common/react_memo"
import {makeTableDrag} from "client/components/table/table_generic_drag"
import {getTableTemplateColumns} from "client/components/table/table_settings"
import {TableHeaderColumnDragHelper} from "client/components/table/table_header_column_drag_helper"
import {TableHeaderResizeHelper} from "client/components/table/table_header_resize_helper"

type Props<T> = {
	columns: TableColumnDefinition<T>[]
	order: TableOrder<T>[]
	setOrder: SetState<TableOrder<T>[]>
	userConfigActions: TableUserConfigActionProps
	swapColumn: (id: string, direction: -1 | 1) => void
	columnWidthOverrides: ReadonlyMap<string, number>
	setColumnWidthOverrides: SetState<ReadonlyMap<string, number>>
}

export const TableHeaders = reactMemo(<T,>({
	columns, order, setOrder, userConfigActions, swapColumn, columnWidthOverrides, setColumnWidthOverrides
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

	return (
		<div
			className={css.tableHeaders}
			style={{
				gridTemplateColumns: getTableTemplateColumns(columns, columnWidthOverrides)
			}}>
			{columns.map((col, i) => {
				const colOrder = order.find(order => order.column.id === col.id)
				const orderIndex = !colOrder || userConfigActions.maxOrderedColumns < 2 ? null : order.indexOf(colOrder)
				const isOrderUserChangeable = col.isOrderUserChangeable ?? userConfigActions.areColumnsOrderable
				const isSwappable = col.isSwappable ?? userConfigActions.areColumnsSwappable
				const isPrevColResizeable = i > 0 && (columns[i - 1]!.isResizeable ?? userConfigActions.areColumnsResizeable)
				const isNextColResizeable = i < columns.length - 1 && (columns[i + 1]!.isResizeable ?? userConfigActions.areColumnsResizeable)
				const isThisColResizeable = col.isResizeable ?? userConfigActions.areColumnsResizeable
				return (
					<TableHeader
						key={col.id}
						column={col}
						minWidth={col.minWidth ?? userConfigActions.defaultMinColumnWidth}
						isSwappable={isSwappable}
						isOrderUserChangeable={isOrderUserChangeable}
						orderDirection={colOrder?.direction ?? null}
						orderIndex={orderIndex}
						onOrderChange={changeColumnOrder}
						swapColumn={swapColumn}
						isLeftResizeable={isPrevColResizeable && isThisColResizeable}
						isRightResizeable={isNextColResizeable && isThisColResizeable}
						setColumnWidthOverrides={setColumnWidthOverrides}
					/>
				)
			})}
		</div>
	)
})


type SingleHeaderProps<T> = {
	column: TableColumnDefinition<T>
	orderDirection: TableOrderDirection | null
	orderIndex: number | null
	onOrderChange: (column: TableColumnDefinition<T>) => void
	swapColumn: (id: string, direction: -1 | 1) => void
	isOrderUserChangeable: boolean
	isSwappable: boolean
	isLeftResizeable: boolean
	isRightResizeable: boolean
	setColumnWidthOverrides: SetState<ReadonlyMap<string, number>>
	minWidth: number
}

const TableHeader = reactMemo(<T,>({
	column, orderDirection, orderIndex, onOrderChange, swapColumn, isOrderUserChangeable, isSwappable, isLeftResizeable, isRightResizeable, setColumnWidthOverrides, minWidth
}: SingleHeaderProps<T>) => {
	const [dragOffset, setDragOffset] = useState(0)
	const [isDragged, setIsDragged] = useState(false)

	const handlerProps = useMemo(() => {

		let onClick: (() => void) | undefined = undefined
		if(isOrderUserChangeable){
			onClick = () => {
				onOrderChange(column)
			}
		}

		let onDownSwap: ((e: React.TouchEvent | React.MouseEvent) => void) | undefined = undefined
		if(isSwappable){
			onDownSwap = makeDragHandler({
				column, swapColumn, setDragOffset, setIsDragged, onClick
			})
		}

		let onDownResize: ((e: React.TouchEvent | React.MouseEvent) => void) | undefined = undefined
		if(isLeftResizeable || isRightResizeable){
			onDownResize = makeResizeHandler({
				setOverrides: setColumnWidthOverrides, minWidth, onClick
			})
		}

		let onDown: ((e: React.TouchEvent | React.MouseEvent) => void) | undefined = undefined
		if(onDownSwap && onDownResize){
			onDown = e => {
				onDownSwap(e)
				onDownResize(e)
			}
		} else {
			onDown = onDownSwap ?? onDownResize
		}

		return {
			onMouseDown: onDown,
			onTouchStart: onDown,
			...(onDownSwap ? {} : {onClick})
		}
	}, [isOrderUserChangeable, isSwappable, column, onOrderChange, swapColumn, isLeftResizeable, isRightResizeable, minWidth, setColumnWidthOverrides])

	const style = {
		gridColumn: `var(--table-col-${column.id})`,
		["--drag-offset"]: dragOffset + "px"
	}

	return (
		<div
			data-column-id={column.id}
			data-is-swappable={isSwappable}
			data-is-resizeable={isLeftResizeable || isRightResizeable}
			className={cn(css.tableHeader, {
				[css.isInteractive!]: isOrderUserChangeable || isSwappable,
				[css.isDragged!]: isDragged
			})}
			style={style}
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
			{isLeftResizeable && <div className={cn(css.columnResizer, css.columnLeftResizer)}/>}
			{isRightResizeable && <div className={cn(css.columnResizer, css.columnRightResizer)}/>}
		</div>
	)
})

const isColumnResizer = (el: HTMLElement) => el.classList.contains(css.columnResizer!)

const makeResizeHandler = (opts: {onClick?: () => void, setOverrides: SetState<ReadonlyMap<string, number>>, minWidth: number}) => {
	let helper: TableHeaderResizeHelper | null = null
	const drag = makeTableDrag({
		direction: "horisontal",
		onClick: opts.onClick,
		thresholdPx: 5,
		canStartAt: coords => isColumnResizer(coords.target),
		reset: () => {
			helper = null
		},
		onStart: coords => {
			helper = new TableHeaderResizeHelper(opts.minWidth, opts.setOverrides, coords.target, coords.x)
		},
		onMove: ({current}) => {
			helper!.onMove(current.x)
		}
	})
	return (e: React.TouchEvent | React.MouseEvent) => {
		drag.onDown(e.nativeEvent)
	}
}

const makeDragHandler = <T,>(opts: {onClick?: () => void, swapColumn: (id: string, direction: -1 | 1) => void, setIsDragged: SetState<boolean>, setDragOffset: SetState<number>, column: TableColumnDefinition<T>}) => {
	let sizeCounter: TableHeaderColumnDragHelper | null = null
	const drag = makeTableDrag({
		direction: "horisontal",
		onClick: opts.onClick,
		thresholdPx: 5,
		canStartAt: coords => !isColumnResizer(coords.target),
		reset: () => {
			sizeCounter = null
			opts.setDragOffset(0)
			opts.setIsDragged(false)
		},
		onStart: coords => {
			sizeCounter = new TableHeaderColumnDragHelper(coords.target, coords.x)
			opts.setIsDragged(true)
		},
		onMove: ({current}) => {
			const offset = sizeCounter!.getOffset(current.x)
			const swapDirection = sizeCounter!.getSwapDirection(offset)

			if(swapDirection !== null){
				opts.swapColumn(opts.column.id, swapDirection)
				sizeCounter!.swap(swapDirection)
				opts.setDragOffset(sizeCounter!.getOffset(current.x))
			} else {
				opts.setDragOffset(offset)
			}
		}
	})
	return (e: React.TouchEvent | React.MouseEvent) => {
		drag.onDown(e.nativeEvent)
	}
}
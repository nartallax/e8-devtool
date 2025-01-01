import {TableColumnDefinition, TableOrderDirection} from "client/components/table/table"
import {SetState} from "client/ui_utils/react_types"
import * as css from "./table.module.css"
import {cn} from "client/ui_utils/classname"
import {useMemo, useState} from "react"
import {Icon} from "generated/icons"
import {reactMemo} from "common/react_memo"
import {makeTableDrag} from "client/components/table/table_generic_drag"
import {getTableTemplateColumns, MutableTableSettings, TableSettings} from "client/components/table/table_settings"
import {TableHeaderColumnDragHelper} from "client/components/table/table_header_column_drag_helper"
import {TableHeaderResizeHelper} from "client/components/table/table_header_resize_helper"
import {useTransformedSetState} from "client/ui_utils/use_wrapped_setstate"

type Props<T> = {
	settings: TableSettings<T>
	setSettings: SetState<MutableTableSettings<T>>
}

export const TableHeaders = reactMemo(<T,>({
	settings, setSettings
}: Props<T>) => {

	return (
		<div
			className={css.tableHeaders}
			style={{
				gridTemplateColumns: getTableTemplateColumns(settings.orderedColumns, settings.columnWidthOverrides)
			}}>
			{settings.orderedColumns.map((col, i) => {
				const colOrder = settings.order.find(order => order.column.id === col.id)
				const orderIndex = !colOrder || settings.userActionConfig.maxOrderedColumns < 2 ? null : settings.order.indexOf(colOrder)
				const isOrderUserChangeable = col.isOrderUserChangeable ?? settings.userActionConfig.areColumnsOrderable
				const isSwappable = col.isSwappable ?? settings.userActionConfig.areColumnsSwappable
				const isPrevColResizeable = i > 0 && (settings.orderedColumns[i - 1]!.isResizeable ?? settings.userActionConfig.areColumnsResizeable)
				const isNextColResizeable = i < settings.orderedColumns.length - 1 && (settings.orderedColumns[i + 1]!.isResizeable ?? settings.userActionConfig.areColumnsResizeable)
				const isThisColResizeable = col.isResizeable ?? settings.userActionConfig.areColumnsResizeable
				return (
					<TableHeader
						key={col.id}
						column={col}
						minWidth={col.minWidth ?? settings.userActionConfig.defaultMinColumnWidth}
						isSwappable={isSwappable}
						isOrderUserChangeable={isOrderUserChangeable}
						orderDirection={colOrder?.direction ?? null}
						orderIndex={orderIndex}
						settings={settings}
						setSettings={setSettings}
						isLeftResizeable={isPrevColResizeable && isThisColResizeable}
						isRightResizeable={isNextColResizeable && isThisColResizeable}
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
	settings: TableSettings<T>
	setSettings: SetState<MutableTableSettings<T>>
	isOrderUserChangeable: boolean
	isSwappable: boolean
	isLeftResizeable: boolean
	isRightResizeable: boolean
	minWidth: number
}

const TableHeader = reactMemo(<T,>({
	column, orderDirection, orderIndex, settings, setSettings, isOrderUserChangeable, isSwappable, isLeftResizeable, isRightResizeable, minWidth
}: SingleHeaderProps<T>) => {
	const [dragOffset, setDragOffset] = useState(0)
	const [isDragged, setIsDragged] = useState(false)

	const setColumnWidthOverrides = useTransformedSetState(setSettings,
		(map: ReadonlyMap<string, number>, settings) => ({...settings, columnWidthOverrides: map}),
		settings => settings.columnWidthOverrides
	)

	const {userActionConfig} = settings

	const handlerProps = useMemo(() => {

		let onClick: (() => void) | undefined = undefined
		if(isOrderUserChangeable){
			onClick = () => {
				setSettings(settings => {
					const orders = settings.order
					const oldDirection = orders.find(order => order.column.id === column.id)?.direction
					const newDirection = !oldDirection ? "asc" : oldDirection === "asc" ? "desc" : null
					let newOrders = orders.filter(order => order.column.id !== column.id)
					if(newDirection){
						newOrders = [
							{column, direction: newDirection},
							...newOrders
						]
					}
					if(newOrders.length > userActionConfig.maxOrderedColumns){
						newOrders = newOrders.slice(0, userActionConfig.maxOrderedColumns)
					}
					return {...settings, order: newOrders}
				})
			}
		}

		let onDownSwap: ((e: React.TouchEvent | React.MouseEvent) => void) | undefined = undefined
		if(isSwappable){
			onDownSwap = makeDragHandler({
				columnId: column.id, setSettings, setDragOffset, setIsDragged, onClick
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
	}, [isOrderUserChangeable, isSwappable, column, userActionConfig, setSettings, isLeftResizeable, isRightResizeable, minWidth, setColumnWidthOverrides])

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

const makeDragHandler = <T,>(opts: {onClick?: () => void, setSettings: SetState<MutableTableSettings<T>>, setIsDragged: SetState<boolean>, setDragOffset: SetState<number>, columnId: string}) => {
	let sizeCounter: TableHeaderColumnDragHelper | null = null

	const swapColumn = (id: string, direction: -1 | 1) => {
		opts.setSettings(settings => {
			const index = settings.orderedColumns.findIndex(col => col.id === id)
			const newIndex = index + direction
			if(newIndex >= 0 && newIndex < settings.orderedColumns.length){
				const newCols = [...settings.orderedColumns]
				const col = newCols[index]!
				newCols[index] = newCols[newIndex]!
				newCols[newIndex] = col
				settings = {
					...settings,
					orderedColumns: newCols
				}
			}
			return settings
		})
	}

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
				swapColumn(opts.columnId, swapDirection)
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
import * as css from "./table.module.css"
import {TableSegment} from "client/components/table/table_segment"
import {TableDataSourceDefinition, TableOrderDirection, useTableDataSource} from "client/components/table/table_data_source"
import {useMemo, useState} from "react"
import {cn} from "client/ui_utils/classname"
import {TableRowDragndrop} from "client/components/table/table_row_dragndrop"
import {useTableSettings} from "client/components/table/table_settings"
import {TableHeaders} from "client/components/table/table_headers"

/** A description of a single row in a tree structure */
export type TableHierarchyEntry<T> = {
	row: T
	rowIndex: number
	parentLoadedRowsCount: number
}

/** Hierarchy is a sequence of rows in tree structure, each one is level further, starting at the root */
export type TableHierarchy<T> = TableHierarchyEntry<T>[]

const emptyArray: any[] = []

const validateColumnId = (id: string) => {
	if(!/^[a-zA-Z\-_]+$/.test(id)){
		throw new Error(`Incorrect column ID: ${JSON.stringify(id)}`)
	}
}

export type TableColumnDefinition<T> = {
	/** ID of the column. Must consist of alphabetic characters and dashes/underscores only. */
	id: string
	header?: React.ReactNode
	render: (renderArgs: {row: T, hierarchy: TableHierarchy<T>}) => React.ReactNode

	/** CSS expression of this column's width. Can use `fr` units and also `auto` keyword. See grid sizing.
	If not specified, will default to `auto`.

	When user resizes the column, width is overriden to px size of whatever user sets it to be. */
	width?: string

	/** If enabled, cells in this column will have elements to represent tree structure and interact with it */
	isTreeColumn?: boolean

	/** If enabled, data can be ordered by this column.

	Keep in mind that it's up to datasource to actually supply table with ordered data.
	All the table does is passes order in loadData options. */
	isOrderUserChangeable?: boolean

	/** If passed, data will be oredered by this column, unless user overrides that.

	You can pass number and order tuple in case you want to order by multiple columns. (bigger priority = column goes first) */
	defaultOrder?: TableOrderDirection | [priority: number, TableOrderDirection]

	/** If enabled, user will be able to swap position of this column with another columns (by dragging column header).
	For swap to happen, both of the columns need to be swappable. */
	isSwappable?: boolean
}

type Props<T> = Partial<TableUserConfigActionProps> & {
	dataSource: TableDataSourceDefinition<T>
	columns: TableColumnDefinition<T>[]
	/** If false, headers will be hidden. True by default */
	areHeadersVisible?: boolean
	/** If passed, table will store user-defined settings in local storage using this key. */
	localStorageKey?: string
}

export type TableUserConfigActionProps = {
	/** Top limit for amount of simultaneously ordered columns.
	If not passed - will be equal to amount of default-oredered columns, or 1 if there are none. */
	maxOrderedColumns: number
	/** If passed, by default user will be able to change order of any column */
	areColumnsOrderable: boolean
	/** If passed, by default user will be able to swap columns' position */
	areColumnsSwappable: boolean
}


export const Table = <T,>({
	columns, dataSource: dataSourceParams, areHeadersVisible = true, ...srcUserConfigActions
}: Props<T>) => {
	const {
		orderedColumns, order, setOrder, userConfigActions, swapColumn
	} = useTableSettings({...srcUserConfigActions, columns})
	const dataSource = useTableDataSource(dataSourceParams, order)

	const tableStyle = useMemo(() => {
		const tableVars = Object.fromEntries(columns.map((col, i) => {
			validateColumnId(col.id)
			return [`--table-col-${col.id}`, `${i + 1} / ${i + 2}`]
		}))

		return {
			gridTemplateColumns: columns.map(col => col.width ?? "auto").join(" "),
			...tableVars
		}
	}, [columns])

	const [currentlyDraggedRow, setCurrentlyDraggedRow] = useState<TableHierarchy<T> | null>(null)

	// this exists to check if a DOM node belongs to this table or different one
	// helps with drag-n-drop
	const tableId = useMemo(() => (Math.random() * 0xffffffff).toString(16), [])

	return (
		<div
			className={cn(css.table, {
				[css.withHeaders!]: areHeadersVisible,
				[css.noTextSelection!]: currentlyDraggedRow !== null
			})}
			style={tableStyle}
			data-table-id={tableId}>
			<TableSegment
				hierarchy={emptyArray}
				columns={columns}
				dataSource={dataSource}
				draggedRowHierarchyTail={currentlyDraggedRow}
				isRowCurrentlyDragged={false}
			/>
			{/* Headers should appear after actual cells; that way they are drawn over absolutely positioned elements within cells
			(yes, I could just use z-index, but it has potential to cause more problems down the line than it solves, so I'd rather not) */}
			{areHeadersVisible
				&& <TableHeaders
					order={order}
					setOrder={setOrder}
					userConfigActions={userConfigActions}
					columns={orderedColumns}
					swapColumn={swapColumn}
				/>}
			<TableRowDragndrop
				tableId={tableId}
				setCurrentlyDraggedRow={setCurrentlyDraggedRow}
				dataSource={dataSource}
			/>
		</div>
	)
}

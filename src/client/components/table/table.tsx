import * as css from "./table.module.css"
import {TableRowSequence} from "client/components/table/table_row_sequence"
import {ReactNode, useMemo, useState} from "react"
import {cn} from "client/ui_utils/classname"
import {TableRowDragndrop} from "client/components/table/table_row_dragndrop"
import {getTableTemplateColumns, useTableSettings} from "client/components/table/table_settings"
import {TableHeaders} from "client/components/table/table_headers"

/** A description of a single row in a tree structure */
export type TableHierarchyEntry<K extends string> = {
	row: TableRow<K>
	rowIndex: number
	parentLoadedRowsCount: number
}

/** Hierarchy is a sequence of rows in tree structure, each one is level further, starting at the root */
export type TableHierarchy<K extends string> = readonly TableHierarchyEntry<K>[]

const emptyArray: any[] = []

const validateColumnId = (id: string) => {
	if(!/^[a-zA-Z\-_]+$/.test(id)){
		// this requirement is imposed because column ids are used as part of CSS var names
		throw new Error(`Incorrect column ID: ${JSON.stringify(id)}`)
	}
}

export type TableColumnDefinition = {
	readonly header?: React.ReactNode

	/** CSS expression of this column's width. Can use `fr` units and also `auto` keyword. See grid sizing.
		If not specified, will default to `auto`.

		When user resizes the column, width is overriden to px size of whatever user sets it to be. */
	readonly width?: string

	/** If enabled, cells in this column will have elements to represent tree structure and interact with it */
	readonly isTreeColumn?: boolean

	/** If enabled, data can be ordered by this column.

		Keep in mind that it's up to datasource to actually supply table with ordered data.
		All the table does is passes order in loadData options. */
	readonly isOrderUserChangeable?: boolean

	/** If passed, data will be oredered by this column, unless user overrides that.

		You can pass number and order tuple in case you want to order by multiple columns. (bigger priority = column goes first) */
	readonly defaultOrder?: TableOrderDirection | [priority: number, TableOrderDirection]

	/** If enabled, user will be able to swap position of this column with another columns (by dragging column header).
		For swap to happen, both of the columns need to be swappable. */
	readonly isSwappable?: boolean

	/** If enabled, user will be able to change width of this column (by dragging column header's border).
		For resize to happen, both of the columns that share the border need to be resizeable. */
	readonly isResizeable?: boolean

	/** Pixel size of min column width. Active during resizing. */
	readonly minWidth?: number
}

export type TableColumnDefinitions<K extends string> = {
	/** ID of the column must consist of alphabetic characters and dashes/underscores only. */
	readonly [columnId in K]: TableColumnDefinition
}

export type TableProps<K extends string> = Partial<TableUserConfigActionProps> & {
	columns: TableColumnDefinitions<K>
	rows: readonly TableRow<K>[]

	/** Checks if the row can be moved to a new location. Defaults to true.
	Makes no sense to use without onRowDrag. */
	canMoveRowTo?: (dragEvent: TableRowMoveEvent<K>) => boolean

	/** Called when user completes drag-n-drop move of a row.
	Table expects that this handler will perform some operation on source data to move row from old position to new.
	Table data won't be re-fetched after operation is complete; instead, table will move the rows internally.
	(it doesn't matter if you're keeping source data in memory and not on server, as you'll have to update datasource anyway in this case)

	This handler can throw to indicate that operation is not successful; table will handle that.

	Keep in mind that moving rows around can cause weirdness when combined with other things, like sorting and pagination.
	It doesn't make much sense to drag-n-drop sorted rows, because order probably won't be saved (unless you update data in some smart way).
	It also can cause pagination-by-constraints to load wrong rows if a row is dragged to the last place.
	Table won't explicitly forbid those use cases, but you should be careful about them. */
	onRowMoved?: (dragEvent: TableRowMoveEvent<K>) => void | Promise<void>

	/** Called when scroll hits the bottom of some sequence.
	Can be used to lazy-load new rows.

	If there's nothing more to load, this callback should do nothing. */
	onBottomHit?: (evt: TableBottomHitEvent<K>) => void | Promise<void>
	/** If false, headers will be hidden. True by default */
	areHeadersVisible?: boolean
}

export type TableBottomHitEvent<K extends string> = {
	knownRows: readonly TableRow<K>[]
	parentRow: TableRow<K> | null
	hierarchy: TableHierarchy<K>
}

export type TableUserConfigActionProps = {
	/** Top limit for amount of simultaneously ordered columns.
	If not passed - will be equal to amount of default-oredered columns, or 1 if there are none. */
	maxOrderedColumns: number
	/** If true, by default user will be able to change order of any column */
	areColumnsOrderable: boolean
	/** If true, by default user will be able to swap columns' position */
	areColumnsSwappable: boolean
	/** If true, by default user will be able to resize columns */
	areColumnsResizeable: boolean
	/** Pixel size of min column width. Active during resizing. */
	defaultMinColumnWidth: number
	/** Part of local storage key. If passed, all configurable settings (width, position...) will be stored there. */
	localStorageId: string | null
}

export type TableRowMoveEvent<K extends string> = {
	/** Location is a sequence of indices of children, from root to the last branch.
	It's like hierarchy, but without other info.
	Here hierarchies are not possible to use because sometimes we want to point to a row that doesn't exist yet (last one in sequence) */
	oldLocation: number[]
	newLocation: number[]
	/** Row that is being moved.
	Can be calculated both from oldLocation and newLocation; is present as separate field for convenience.

	(same goes for parent rows) */
	row: TableRow<K>
	oldParent: TableRow<K> | null
	newParent: TableRow<K> | null
}

export type TableOrderDirection = "asc" | "desc"

export type TableOrder<K extends string> = {
	columnId: K
	direction: TableOrderDirection
}

export type TableRow<K extends string> = {
	readonly [columnName in K]: ReactNode
} & {
	readonly key: string | number
	/** Children of this table row, if this table row can have children.
	If nothing (undefined) is passed - it is assumed that this row cannot have children.
	Empty array can be passed in case of loading child rows on demand. */
	readonly children?: TableRow<K>[]
	/** If there are more rows to be loaded, this property should be true */
	readonly canLoadMoreChildren?: boolean
}


export const Table = <const K extends string>({
	columns: srcColumns, areHeadersVisible = true, rows, canMoveRowTo, onRowMoved, onBottomHit, ...srcUserConfigActions
}: TableProps<K>) => {
	const {
		orderedColumnIds, order, setOrder, userConfigActions, swapColumn, columnWidthOverrides, setColumnWidthOverrides
	} = useTableSettings({...srcUserConfigActions, columns: srcColumns})

	const tableStyle = useMemo(() => {
		const tableVars = Object.fromEntries(orderedColumnIds.map((id, i) => {
			validateColumnId(id)
			return [`--table-col-${id}`, `${i + 1} / ${i + 2}`]
		}))

		return {
			gridTemplateColumns: getTableTemplateColumns(orderedColumnIds, srcColumns, columnWidthOverrides),
			...tableVars
		}
	}, [srcColumns, orderedColumnIds, columnWidthOverrides])

	const [currentlyDraggedRow, setCurrentlyDraggedRow] = useState<TableHierarchy<K> | null>(null)

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
			<TableRowSequence
				hierarchy={emptyArray}
				columns={srcColumns}
				draggedRowHierarchyTail={currentlyDraggedRow}
				isRowCurrentlyDragged={false}
				segmentData={rows}
				onBottomHit={onBottomHit}
			/>
			{/* Headers should appear after actual cells; that way they are drawn over absolutely positioned elements within cells
			(yes, I could just use z-index, but it has potential to cause more problems down the line than it solves, so I'd rather not) */}
			{areHeadersVisible
				&& <TableHeaders
					order={order}
					setOrder={setOrder}
					userConfigActions={userConfigActions}
					orderedColumnIds={orderedColumnIds}
					columns={srcColumns}
					swapColumn={swapColumn}
					columnWidthOverrides={columnWidthOverrides}
					setColumnWidthOverrides={setColumnWidthOverrides}
				/>}
			<TableRowDragndrop
				tableId={tableId}
				setCurrentlyDraggedRow={setCurrentlyDraggedRow}
				rows={rows}
				canMoveRowTo={canMoveRowTo}
				onRowMoved={onRowMoved}
			/>
		</div>
	)
}

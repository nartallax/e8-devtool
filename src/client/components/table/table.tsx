import * as css from "./table.module.css"
import {TableRowSequence} from "client/components/table/table_row_sequence"
import {ReactNode, useMemo, useState} from "react"
import {cn} from "client/ui_utils/classname"
import {TableRowDragndrop} from "client/components/table/table_row_dragndrop"
import {getTableTemplateColumns, MutableTableSettings, TableSettings} from "client/components/table/table_settings"
import {TableHeaders} from "client/components/table/table_headers"
import {SetState} from "client/ui_utils/react_types"
import {noop} from "client/ui_utils/noop"
import {DefaultableSideSize} from "client/ui_utils/sizes"
import {useTableCursorSelectionHandlers} from "client/components/table/table_cursor_selection"

/** A description of a single row in a tree structure */
export type TableHierarchyEntry<T> = {
	readonly row: T
	readonly rowIndex: number
	readonly parentLoadedRowsCount: number
}

/** Hierarchy is a sequence of rows in tree structure, each one is level further, starting at the root */
export type TableHierarchy<T> = readonly TableHierarchyEntry<T>[]

const emptyArray: any[] = []

const validateColumnId = (id: string) => {
	if(!/^[a-zA-Z\-_]+$/.test(id)){
		// this requirement is imposed because column ids are used as part of CSS var names
		throw new Error(`Incorrect column ID: ${JSON.stringify(id)}`)
	}
}

export type TableColumnDefinition<T> = {
	/** ID of the column must consist of alphabetic characters and dashes/underscores only. */
	readonly id: string

	/** Render a cell of this column for a given row */
	readonly render: (args: TableRowRenderArgs<T>) => ReactNode

	readonly header?: React.ReactNode

	/** CSS expression of this column's width. Can use `fr` units and also `auto` keyword. See grid sizing.
		If not specified, will default to `auto`.

		When user resizes the column, width is overriden to px size of whatever user sets it to be. */
	readonly width?: string
	readonly padding?: DefaultableSideSize

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

export type TableRowRenderArgs<T> = {
	row: T
	hierarchy: TableHierarchy<T>
}

export type TableProps<T> = {
	settings: TableSettings<T>
	setSettings?: SetState<MutableTableSettings<T>>
	rows: readonly T[]

	getRowKey: (row: T, indexInSequence: number) => string | number

	/** Returns children of the row.
	null/undefined means "this row can never have children"
	Empty array means "this row doesn't have children right now, but they may be loaded"; see onBottomHit */
	getChildren?: (row: T) => readonly T[] | null | undefined

	/** Checks if the row can be moved to a new location. Defaults to true.
	Makes no sense to use without onRowDrag. */
	canMoveRowTo?: (dragEvent: TableRowMoveEvent<T>) => boolean

	/** Called when user completes drag-n-drop move of a row.
	Table expects that this handler will perform some operation on source data to move row from old position to new.
	Table data won't be re-fetched after operation is complete; instead, table will move the rows internally.
	(it doesn't matter if you're keeping source data in memory and not on server, as you'll have to update datasource anyway in this case)

	This handler can throw to indicate that operation is not successful; table will handle that.

	Keep in mind that moving rows around can cause weirdness when combined with other things, like sorting and pagination.
	It doesn't make much sense to drag-n-drop sorted rows, because order probably won't be saved (unless you update data in some smart way).
	It also can cause pagination-by-constraints to load wrong rows if a row is dragged to the last place.
	Table won't explicitly forbid those use cases, but you should be careful about them. */
	onRowMoved?: (dragEvent: TableRowMoveEvent<T>) => void | Promise<void>

	/** Called when scroll hits the bottom of some sequence.
	Can be used to lazy-load new rows.

	If there's nothing more to load, this callback should do nothing. */
	onBottomHit?: (evt: TableBottomHitEvent<T>) => void | Promise<void>

	/** If false, headers will be hidden. True by default */
	areHeadersVisible?: boolean

	/** Inline editor for rows. Used when editedRow or newRow are passed.
	Returning single node implies that editor will be stretched for the full row.
	Returning several means one node for each column (in order of column appearance in definition).

	This function is called like a function, not rendered like a react component. */
	getRowEditor?: (props: TableRowEditorProps<T>) => ReactNode | ReactNode[]

	/** If present, replaces row at location with editors, see getRowEditor. */
	editedRow?: readonly number[] | null
	onEditCompleted?: (evt: TableEditCompletedEvent<T>) => void | Promise<void>

	/** If present, makes a fake empty row at the location.
	New row is always edited; if editedRow is passed, its value is ignored. */
	createdRow?: readonly number[] | null
	onCreateCompleted?: (evt: TableEditCompletedEvent<T>) => void | Promise<void>

	selectedRows?: TableRowSequenceDesignator | null
	setSelectedRows?: SetState<TableRowSequenceDesignator | null>

	rowCursor?: readonly number[] | null
	setRowCursor?: SetState<readonly number[] | null>
	isAutofocused?: boolean
}

/** A sequence of rows. All of those rows are on a same level. */
export type TableRowSequenceDesignator = {
	readonly firstRow: readonly number[]
	readonly count: number
}

export type TableRowEditorProps<T> = {
	readonly location: readonly number[]
	readonly row: T | null
	readonly isDisabled: boolean
	readonly onDone: (newRow: T | null) => Promise<void>
}

export type TableEditCompletedEvent<T> = {
	/** Null implies that editing was cancelled */
	readonly row: T | null
	readonly location: readonly number[]
}


export type TableBottomHitEvent<T> = {
	knownRows: readonly T[]
	parentRow: T | null
	hierarchy: TableHierarchy<T>
}

export type TableRowMoveEvent<T> = {
	/** Location is a sequence of indices of children, from root to the last branch.
	It's like hierarchy, but without other info.
	Here hierarchies are not possible to use because sometimes we want to point to a row that doesn't exist yet (last one in sequence) */
	oldLocation: number[]
	newLocation: number[]
	/** Row that is being moved.
	Can be calculated both from oldLocation and newLocation; is present as separate field for convenience.

	(same goes for parent rows) */
	row: T
	oldParent: T | null
	newParent: T | null
}

export type TableOrderDirection = "asc" | "desc"

export type TableOrder<T> = {
	column: TableColumnDefinition<T>
	direction: TableOrderDirection
}

export const Table = <T,>({
	settings, setSettings = noop, areHeadersVisible = true, rows, canMoveRowTo, onRowMoved, onBottomHit, editedRow, createdRow, onCreateCompleted, onEditCompleted, getRowEditor, getRowKey, getChildren, selectedRows, setSelectedRows, rowCursor, setRowCursor, isAutofocused
}: TableProps<T>) => {

	const {orderedColumns, columnWidthOverrides} = settings

	const tableStyle = useMemo(() => {
		const tableVars = Object.fromEntries(orderedColumns.map((column, i) => {
			validateColumnId(column.id)
			return [`--table-col-${column.id}`, `${i + 1} / ${i + 2}`]
		}))

		return {
			gridTemplateColumns: getTableTemplateColumns(orderedColumns, columnWidthOverrides),
			...tableVars
		}
	}, [orderedColumns, columnWidthOverrides])

	const [currentlyDraggedRow, setCurrentlyDraggedRow] = useState<TableHierarchy<T> | null>(null)

	// this exists to check if a DOM node belongs to this table or to different one
	// helps with drag-n-drop
	const tableId = useMemo(() => (Math.random() * 0xffffffff).toString(16), [])

	const isRowCreated = !!createdRow
	const editedRowLocation = createdRow ?? editedRow
	const completeEdit = editedRowLocation === createdRow ? onCreateCompleted : onEditCompleted

	const rootRef = (el: HTMLDivElement | null) => {
		if(el && isAutofocused){
			el.focus()
		}
	}

	const cursorSelectionProps = useTableCursorSelectionHandlers({
		rows, getChildren, rowCursor, setRowCursor, setSelectedRows
	})

	return (
		<div
			ref={rootRef}
			tabIndex={0}
			className={cn(css.table, {
				[css.withHeaders!]: areHeadersVisible,
				[css.noTextSelection!]: currentlyDraggedRow !== null
			})}
			style={tableStyle}
			data-table-id={tableId}
			{...cursorSelectionProps}>
			<TableRowSequence
				hierarchy={emptyArray}
				columns={settings.columns}
				draggedRowHierarchy={currentlyDraggedRow}
				isRowCurrentlyDragged={false}
				segmentData={rows}
				onBottomHit={onBottomHit}
				editedRow={editedRowLocation}
				isRowCreated={isRowCreated}
				completeEdit={completeEdit}
				getRowEditor={getRowEditor}
				getRowKey={getRowKey}
				getChildren={getChildren}
				selectedRows={selectedRows}
				setSelectedRows={setSelectedRows}
				rowCursor={rowCursor}
				setRowCursor={setRowCursor}
			/>
			{/* Headers should appear after actual cells; that way they are drawn over absolutely positioned elements within cells
			(yes, I could just use z-index, but it has potential to cause more problems down the line than it solves, so I'd rather not) */}
			{areHeadersVisible
				&& <TableHeaders
					settings={settings}
					setSettings={setSettings}
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

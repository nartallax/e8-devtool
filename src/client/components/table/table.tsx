import * as css from "./table.module.css"
import {TableRowSequence} from "client/components/table/table_row_sequence"
import {MouseEvent, ReactNode, useCallback, useEffect, useMemo, useState} from "react"
import {cn} from "client/ui_utils/classname"
import {TableRowDragndrop} from "client/components/table/table_row_dragndrop"
import {getTableTemplateColumns, MutableTableSettings, TableSettings} from "client/components/table/table_settings"
import {TableHeaders} from "client/components/table/table_headers"
import {SetState} from "client/ui_utils/react_types"
import {noop} from "client/ui_utils/noop"
import {DefaultableSideSize} from "client/ui_utils/sizes"
import {useTableCursorSelectionHandlers} from "client/components/table/table_cursor_selection"
import {TableExpansionTree} from "client/components/table/table_expansion_tree"
import {TableUtils} from "client/components/table/table_utils"
import {setStateAndReturn} from "client/ui_utils/set_state_and_return"
import {useRefValue} from "common/ref_value"

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

	/** CSS expression of this column's width. Can use `fr` units. See grid sizing guide.
		If not specified, will default to `1fr`.
		Using `auto` is not recommended if you have more than one column.

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

	onRowClick?: (evt: TableRowEvent<T>) => void
	onRowDoubleClick?: (evt: TableRowEvent<T>) => void
}

export type TableRowEvent<T> = {
	readonly row: T
	readonly hierarchy: TableHierarchy<T>
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
	oldLocation: TableRowSequenceDesignator
	newLocation: TableRowSequenceDesignator
	/** Row that is being moved.
	Can be calculated both from oldLocation and newLocation; is present as separate field for convenience.

	(same goes for parent rows) */
	rows: T[]
	oldParent: T | null
	newParent: T | null
}

export type TableOrderDirection = "asc" | "desc"

export type TableOrder<T> = {
	column: TableColumnDefinition<T>
	direction: TableOrderDirection
}

export const Table = <T,>({
	settings, setSettings = noop, areHeadersVisible = true, rows, canMoveRowTo, onRowMoved, onBottomHit, editedRow, createdRow, onCreateCompleted, onEditCompleted, getRowEditor, getRowKey, getChildren, selectedRows, setSelectedRows, rowCursor, setRowCursor, isAutofocused, onRowClick, onRowDoubleClick
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

	const [currentlyDraggedRows, setCurrentlyDraggedRows] = useState<TableRowSequenceDesignator | null>(null)

	// this exists to check if a DOM node belongs to this table or to different one
	// helps with drag-n-drop
	const tableId = useMemo(() => Math.floor(Math.random() * 0xffffffff).toString(16), [])

	const isRowCreated = !!createdRow
	const editedRowLocation = createdRow ?? editedRow
	const completeEdit = editedRowLocation === createdRow ? onCreateCompleted : onEditCompleted

	const rootRef = (el: HTMLDivElement | null) => {
		if(el && isAutofocused){
			el.focus()
		}
	}

	const [lastSelectionStart, setLastSelectionStart] = useState<readonly number[] | null>(null)

	const [expTree, setExpTree] = useState(new TableExpansionTree())
	const toggleExpanded = useCallback(async(hierarchy: TableHierarchy<T>) => {
		const shouldClearSelection = !setSelectedRows ? false : await setStateAndReturn(setSelectedRows, rows => {
			const shouldClearSelection = !!rows && TableUtils.locationStartsWithLocation(hierarchy.map(x => x.rowIndex), rows.firstRow)
			if(shouldClearSelection){
				// if the selection is inside the tree when tree is collapsed - clear the selection
				// because invisible selection is confusing for user
				// same goes for cursor
				return [null, true]
			}
			return [rows, false]
		})
		if(shouldClearSelection){
			setLastSelectionStart(null)
		}

		setRowCursor?.(cursor => {
			if(cursor && TableUtils.locationStartsWithLocation(hierarchy.map(x => x.rowIndex), cursor)){
				return null
			}
			return cursor
		})

		setExpTree(tree => {
			if(!tree.hasHierarchy(hierarchy)){
				return tree.addHierarchy(hierarchy)
			}
			return tree.removeHierarchy(hierarchy)
		})
	}, [setSelectedRows, setRowCursor])

	const cursorSelectionProps = useTableCursorSelectionHandlers({
		lastSelectionStart, setLastSelectionStart,
		rows, getChildren, rowCursor, setRowCursor, selectedRows, setSelectedRows, expTree, setExpTree
	})

	const rowsRef = useRefValue(rows)
	const onClick = useMemo(() => !onRowClick ? undefined : (evt: MouseEvent) => {
		const rowEvt = TableUtils.eventToRowEvent(rowsRef.current, getChildren, evt)
		if(rowEvt){
			onRowClick(rowEvt)
		}
	}, [rowsRef, onRowClick, getChildren])
	const onDoubleClick = useMemo(() => !onRowDoubleClick ? undefined : (evt: MouseEvent) => {
		const rowEvt = TableUtils.eventToRowEvent(rowsRef.current, getChildren, evt)
		if(rowEvt){
			onRowDoubleClick(rowEvt)
		}
	}, [rowsRef, onRowDoubleClick, getChildren])

	useEffect(() => {
		if(editedRowLocation){
			setExpTree(tree => tree.add(editedRowLocation))
		}
	}, [editedRowLocation])

	return (
		<div
			ref={rootRef}
			tabIndex={0}
			className={cn(css.table, {
				[css.withHeaders!]: areHeadersVisible,
				[css.noTextSelection!]: currentlyDraggedRows !== null
			})}
			style={tableStyle}
			data-table-id={tableId}
			{...cursorSelectionProps}
			onClick={onClick}
			onDoubleClick={onDoubleClick}>
			<TableRowSequence
				hierarchy={emptyArray}
				columns={settings.columns}
				draggedRows={currentlyDraggedRows}
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
				rowCursor={rowCursor}
				expTree={expTree}
				toggleExpanded={toggleExpanded}
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
				setCurrentlyDraggedRows={setCurrentlyDraggedRows}
				rows={rows}
				canMoveRowTo={canMoveRowTo}
				getChildren={getChildren}
				onRowMoved={onRowMoved}
				selectedRows={selectedRows}
				setSelectedRows={setSelectedRows}
				setRowCursor={setRowCursor}
				setLastSelectionStart={setLastSelectionStart}
				setExpTree={setExpTree}
			/>
		</div>
	)
}

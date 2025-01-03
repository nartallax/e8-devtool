import {TableColumnDefinition, TableHierarchy, TableProps, TableRowSequenceDesignator} from "client/components/table/table"
import {reactMemo} from "common/react_memo"
import {TableCell} from "client/components/table/table_cell"
import {useEffect, useState} from "react"
import {TableRowSequence} from "client/components/table/table_row_sequence"
import {TableUtils} from "client/components/table/table_utils"
import {TableEditedRow} from "client/components/table/table_edited_row"

type Props<T> = {
	hierarchy: TableHierarchy<T>
	draggedRows: TableRowSequenceDesignator | null
	isRowCurrentlyDragged: boolean
	editedRow?: readonly number[] | null
	completeEdit?: TableProps<T>["onEditCompleted"]
	isRowCreated: boolean
	columns: readonly TableColumnDefinition<T>[]
} & Pick<TableProps<T>, "onBottomHit" | "getRowEditor" | "getChildren" | "getRowKey" | "selectedRows" | "setSelectedRows" | "rowCursor" | "setRowCursor">

export const TableRow = reactMemo(<T,>({
	hierarchy, columns, draggedRows, isRowCurrentlyDragged, onBottomHit, editedRow, completeEdit, getRowEditor, isRowCreated, getChildren, getRowKey, selectedRows, setSelectedRows, rowCursor, setRowCursor
}: Props<T>) => {
	const row = hierarchy[hierarchy.length - 1]!.row
	const [isExpanded, setExpanded] = useState(false)
	const children = getChildren?.(row)
	const isExpandable = !!children
	const _isRowCurrentlyDragged = isRowCurrentlyDragged
		|| (!!draggedRows && TableUtils.isHierarchyIncludedInDesignator(hierarchy, draggedRows))
	const isRowSelected = !!selectedRows && TableUtils.isHierarchyIncludedInDesignator(hierarchy, selectedRows)
	const isRowOnCursor = !!rowCursor && TableUtils.locationMatchesHierarchy(rowCursor, hierarchy)

	const isThisRowEdited = !!editedRow && !isRowCreated && TableUtils.locationMatchesHierarchy(editedRow, hierarchy)

	useEffect(() => {
		if(!isExpandable || isExpanded || !editedRow){
			return
		}
		if(editedRow.length >= hierarchy.length + 1 && TableUtils.hierarchyStartsWithLocation(editedRow, hierarchy)){
			setExpanded(true)
		}
	}, [isExpandable, isExpanded, hierarchy, editedRow])

	return (
		<>
			{isThisRowEdited ? <TableEditedRow
				columns={columns}
				location={editedRow}
				row={row}
				completeEdit={completeEdit}
				getRowEditor={getRowEditor}
			/> : columns.map(column => (
				<TableCell
					hierarchy={hierarchy}
					column={column}
					key={column.id}
					isExpanded={isExpanded}
					setExpanded={!isExpandable ? null : setExpanded}
					isRowCurrentlyDragged={_isRowCurrentlyDragged}
					isSelected={isRowSelected}
					isOnCursor={isRowOnCursor}
				/>
			))}
			{isExpanded && children
			&& <TableRowSequence
				key="row-children"
				hierarchy={hierarchy}
				onBottomHit={onBottomHit}
				columns={columns}
				segmentData={children}
				draggedRows={draggedRows}
				isRowCurrentlyDragged={_isRowCurrentlyDragged}
				editedRow={editedRow}
				completeEdit={completeEdit}
				getRowEditor={getRowEditor}
				isRowCreated={isRowCreated}
				getChildren={getChildren}
				getRowKey={getRowKey}
				selectedRows={selectedRows}
				setSelectedRows={setSelectedRows}
				rowCursor={rowCursor}
				setRowCursor={setRowCursor}
			/>}
		</>
	)
})
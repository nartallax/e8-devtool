import {TableHierarchy, TableProps} from "client/components/table/table"
import {reactMemo} from "common/react_memo"
import {TableCell} from "client/components/table/table_cell"
import {useEffect, useState} from "react"
import {TableRowSequence} from "client/components/table/table_row_sequence"
import {TableUtils} from "client/components/table/table_utils"
import {TableEditedRow} from "client/components/table/table_edited_row"

type Props<K extends string> = {
	hierarchy: TableHierarchy<K>
	draggedRowHierarchyTail: TableHierarchy<K> | null
	isRowCurrentlyDragged: boolean
	editedRow?: readonly number[] | null
	completeEdit?: TableProps<K>["onEditCompleted"]
	isRowCreated: boolean
} & Pick<TableProps<K>, "columns" | "onBottomHit" | "getRowEditor">

// it's called this way because TableRow is a type already, and is more important than internal table component
export const TableRowCells = reactMemo(<K extends string>({
	hierarchy, columns, draggedRowHierarchyTail, isRowCurrentlyDragged, onBottomHit, editedRow, completeEdit, getRowEditor, isRowCreated
}: Props<K>) => {
	const row = hierarchy[hierarchy.length - 1]!.row
	const [isExpanded, setExpanded] = useState(false)
	const isExpandable = !!row.children
	const _isRowCurrentlyDragged = isRowCurrentlyDragged || draggedRowHierarchyTail?.length === 0

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
			/> : TableUtils.colEntries(columns).map(([columnId, column]) => (
				<TableCell
					hierarchy={hierarchy}
					column={column}
					key={columnId}
					columnId={columnId}
					isExpanded={isExpanded}
					setExpanded={!isExpandable ? null : setExpanded}
					isRowCurrentlyDragged={_isRowCurrentlyDragged}
				/>
			))}
			{isExpanded && row.children
			&& <TableRowSequence
				key="row-children"
				hierarchy={hierarchy}
				onBottomHit={onBottomHit}
				columns={columns}
				segmentData={row.children}
				draggedRowHierarchyTail={draggedRowHierarchyTail}
				isRowCurrentlyDragged={_isRowCurrentlyDragged}
				editedRow={editedRow}
				completeEdit={completeEdit}
				getRowEditor={getRowEditor}
				isRowCreated={isRowCreated}
			/>}
		</>
	)
})
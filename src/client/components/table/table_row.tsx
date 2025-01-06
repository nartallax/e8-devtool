import {TableColumnDefinition, TableHierarchy, TableProps, TableRowSequenceDesignator} from "client/components/table/table"
import {reactMemo} from "common/react_memo"
import {TableCell} from "client/components/table/table_cell"
import {TableRowSequence} from "client/components/table/table_row_sequence"
import {TableUtils} from "client/components/table/table_utils"
import {TableEditedRow} from "client/components/table/table_edited_row"
import {TableExpansionTree} from "client/components/table/table_expansion_tree"

type Props<T> = {
	hierarchy: TableHierarchy<T>
	draggedRows: TableRowSequenceDesignator | null
	isRowCurrentlyDragged: boolean
	editedRow?: readonly number[] | null
	completeEdit?: TableProps<T>["onEditCompleted"]
	isRowCreated: boolean
	columns: readonly TableColumnDefinition<T>[]
	expTree: TableExpansionTree
	toggleExpanded: (hierarchy: TableHierarchy<T>) => void
} & Pick<TableProps<T>, "onBottomHit" | "getRowEditor" | "getChildren" | "getRowKey" | "selectedRows" | "rowCursor">

export const TableRow = reactMemo(<T,>({
	hierarchy, columns, draggedRows, isRowCurrentlyDragged, onBottomHit, editedRow, completeEdit, getRowEditor, isRowCreated, getChildren, getRowKey, selectedRows, rowCursor, expTree, toggleExpanded
}: Props<T>) => {
	const row = hierarchy[hierarchy.length - 1]!.row
	const children = getChildren?.(row)
	const isExpandable = !!children
	const _isRowCurrentlyDragged = isRowCurrentlyDragged
		|| (!!draggedRows && TableUtils.isHierarchyIncludedInDesignator(hierarchy, draggedRows))
	const isRowSelected = !!selectedRows && TableUtils.isHierarchyIncludedInDesignator(hierarchy, selectedRows)
	const isRowOnCursor = !!rowCursor && TableUtils.locationMatchesHierarchy(rowCursor, hierarchy)

	const isThisRowEdited = !!editedRow && !isRowCreated && TableUtils.locationMatchesHierarchy(editedRow, hierarchy)
	const isExpanded = isExpandable && expTree.hasHierarchy(hierarchy)

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
					toggleExpanded={!isExpandable ? null : toggleExpanded}
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
				rowCursor={rowCursor}
				expTree={expTree}
				toggleExpanded={toggleExpanded}
			/>}
		</>
	)
})
import {TableHierarchy, TableProps} from "client/components/table/table"
import {reactMemo} from "common/react_memo"
import {TableCell} from "client/components/table/table_cell"
import {useState} from "react"
import {TableRowSequence} from "client/components/table/table_row_sequence"

type Props<T> = {
	hierarchy: TableHierarchy<T>
	draggedRowHierarchyTail: TableHierarchy<T> | null
	isRowCurrentlyDragged: boolean
} & Pick<TableProps<T>, "columns" | "getRowKey" | "onBottomHit" | "canHaveChildren" | "getChildren">

export const TableRow = reactMemo(<T,>({
	hierarchy, columns, draggedRowHierarchyTail, isRowCurrentlyDragged, canHaveChildren, getRowKey, onBottomHit, getChildren
}: Props<T>) => {
	const [isExpanded, setExpanded] = useState(false)
	const isExpandable = !!canHaveChildren?.(hierarchy[hierarchy.length - 1]!.row)
	const _isRowCurrentlyDragged = isRowCurrentlyDragged || draggedRowHierarchyTail?.length === 0

	return (
		<>
			{columns.map(column => (
				<TableCell
					hierarchy={hierarchy}
					column={column}
					key={column.id}
					isExpanded={isExpanded}
					setExpanded={!isExpandable ? null : setExpanded}
					isRowCurrentlyDragged={_isRowCurrentlyDragged}
				/>
			))}
			{isExpanded && getChildren
			&& <TableRowSequence
				key="row-children"
				hierarchy={hierarchy}
				getRowKey={getRowKey}
				onBottomHit={onBottomHit}
				canHaveChildren={canHaveChildren}
				getChildren={getChildren}
				columns={columns}
				segmentData={getChildren(hierarchy[hierarchy.length - 1]!.row)}
				draggedRowHierarchyTail={draggedRowHierarchyTail}
				isRowCurrentlyDragged={_isRowCurrentlyDragged}
			/>}
		</>
	)
})
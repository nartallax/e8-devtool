import {TableHierarchy, TableProps} from "client/components/table/table"
import {reactMemo} from "common/react_memo"
import {TableCell} from "client/components/table/table_cell"
import {useState} from "react"
import {TableRowSequence} from "client/components/table/table_row_sequence"
import {TableUtils} from "client/components/table/table_utils"

type Props<K extends string> = {
	hierarchy: TableHierarchy<K>
	draggedRowHierarchyTail: TableHierarchy<K> | null
	isRowCurrentlyDragged: boolean
} & Pick<TableProps<K>, "columns" | "onBottomHit">

// it's called this way because TableRow is a type already, and is more important than internal table component
export const TableRowCells = reactMemo(<K extends string>({
	hierarchy, columns, draggedRowHierarchyTail, isRowCurrentlyDragged, onBottomHit
}: Props<K>) => {
	const row = hierarchy[hierarchy.length - 1]!.row
	const [isExpanded, setExpanded] = useState(false)
	const isExpandable = !!row.children
	const _isRowCurrentlyDragged = isRowCurrentlyDragged || draggedRowHierarchyTail?.length === 0

	return (
		<>
			{TableUtils.colEntries(columns).map(([columnId, column]) => (
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
			/>}
		</>
	)
})
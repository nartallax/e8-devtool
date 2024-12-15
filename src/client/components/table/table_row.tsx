import {TableColumnDefinition, TableHierarchy} from "client/components/table/table"
import {reactMemo} from "common/react_memo"
import {TableCell} from "client/components/table/table_cell"
import {TableDataSource} from "client/components/table/table_data_source"
import {useState} from "react"
import {TableSegment} from "client/components/table/table_segment"

type Props<T> = {
	columns: TableColumnDefinition<T>[]
	hierarchy: TableHierarchy<T>
	dataSource: TableDataSource<T>
	draggedRowHierarchyTail: TableHierarchy<T> | null
}

export const TableRow = reactMemo(<T,>({
	hierarchy, columns, dataSource, draggedRowHierarchyTail
}: Props<T>) => {
	const [isExpanded, setExpanded] = useState(false)
	const canHaveChildren = dataSource.isTreeDataSource && dataSource.canHaveChildren(hierarchy[hierarchy.length - 1]!.row)
	const isRowCurrentlyDragged = draggedRowHierarchyTail?.length === 0

	return (
		<>
			{columns.map(column => (
				<TableCell
					hierarchy={hierarchy}
					column={column}
					key={column.id}
					isExpanded={isExpanded}
					setExpanded={!canHaveChildren ? null : setExpanded}
					isRowCurrentlyDragged={isRowCurrentlyDragged}
				/>
			))}
			{canHaveChildren
			&& isExpanded
			&& <TableSegment
				key="row-children"
				hierarchy={hierarchy}
				columns={columns}
				dataSource={dataSource}
				draggedRowHierarchyTail={draggedRowHierarchyTail}
			/>}
		</>
	)
})
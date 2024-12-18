import {TableColumnDefinition, TableHierarchy} from "client/components/table/table"
import {reactMemo} from "common/react_memo"
import {TableCell} from "client/components/table/table_cell"
import {TableDataSource} from "client/components/table/table_data_source"
import {useRef, useState} from "react"
import {TableSegment} from "client/components/table/table_segment"

type Props<T> = {
	columns: TableColumnDefinition<T>[]
	hierarchy: TableHierarchy<T>
	dataSource: TableDataSource<T>
	draggedRowHierarchyTail: TableHierarchy<T> | null
	isRowCurrentlyDragged: boolean
}

let renderCount = 0

export const TableRow = reactMemo(<T,>({
	hierarchy, columns, dataSource, draggedRowHierarchyTail, isRowCurrentlyDragged
}: Props<T>) => {
	const localRC = useRef(0)
	console.log({totalRC: renderCount++, localRC: localRC.current++})

	const [isExpanded, setExpanded] = useState(false)
	const canHaveChildren = dataSource.isTreeDataSource && dataSource.canHaveChildren(hierarchy[hierarchy.length - 1]!.row)
	const _isRowCurrentlyDragged = isRowCurrentlyDragged || draggedRowHierarchyTail?.length === 0

	return (
		<>
			{columns.map(column => (
				<TableCell
					hierarchy={hierarchy}
					column={column}
					key={column.id}
					isExpanded={isExpanded}
					setExpanded={!canHaveChildren ? null : setExpanded}
					isRowCurrentlyDragged={_isRowCurrentlyDragged}
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
				isRowCurrentlyDragged={_isRowCurrentlyDragged}
			/>}
		</>
	)
})
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
}

export const TableRow = reactMemo(<T,>({hierarchy, columns, dataSource}: Props<T>) => {
	const [isExpanded, setExpanded] = useState(false)
	const canHaveChildren = dataSource.isTreeDataSource && dataSource.canHaveChildren(hierarchy[hierarchy.length - 1]!.row)

	return (
		<>
			<tr>
				{columns.map((column, index) => (
					<TableCell
						hierarchy={hierarchy}
						column={column}
						key={column.id ?? index}
						isExpanded={isExpanded}
						setExpanded={!canHaveChildren ? null : setExpanded}
					/>
				))}
			</tr>
			{canHaveChildren
			&& isExpanded
			&& <TableSegment hierarchy={hierarchy} columns={columns} dataSource={dataSource}/>}
		</>
	)
})
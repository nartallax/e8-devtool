import {TableColumnDefinition, TableHierarchy} from "client/components/table/table"
import {TableDataSource, useCachedTableSegmentData} from "client/components/table/table_data_source"
import {TableInfiniteScroll} from "client/components/table/table_infinite_scroll"
import {TableRow} from "client/components/table/table_row"
import {reactMemo} from "common/react_memo"
import {useMemo} from "react"

type Props<T> = {
	hierarchy: TableHierarchy<T>
	columns: TableColumnDefinition<T>[]
	dataSource: TableDataSource<T>
	draggedRowHierarchyTail: TableHierarchy<T> | null
	isRowCurrentlyDragged: boolean
}

export const TableSegment = reactMemo(<T,>({
	hierarchy, dataSource, columns, draggedRowHierarchyTail, isRowCurrentlyDragged
}: Props<T>) => {
	const [segmentData, loadMore] = useCachedTableSegmentData({hierarchy, dataSource})

	const rowsWithHierarchy = useMemo(() =>
		segmentData.map((row, index) => ({row, hierarchy: [...hierarchy, {row, rowIndex: index, parentLoadedRowsCount: segmentData.length}]}))
	, [segmentData, hierarchy])

	return (
		<TableInfiniteScroll onBottomHit={loadMore} triggerOffsetPx={50}>
			{rowsWithHierarchy.map(({row, hierarchy}, index) => (
				<TableRow
					isRowCurrentlyDragged={isRowCurrentlyDragged}
					key={dataSource.getRowKey(row, index)}
					hierarchy={hierarchy}
					columns={columns}
					dataSource={dataSource}
					draggedRowHierarchyTail={draggedRowHierarchyTail?.[0]?.rowIndex !== index ? null : draggedRowHierarchyTail.slice(1)}
				/>
			))}
		</TableInfiniteScroll>
	)
})
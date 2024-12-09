import {TableColumnDefinition, TableHierarchy} from "client/components/table/table"
import {TableDataSource} from "client/components/table/table_data_source"
import {TableInfiniteScroll} from "client/components/table/table_infinite_scroll"
import {TableRow} from "client/components/table/table_row"
import {reactMemo} from "common/react_memo"
import {useCallback, useMemo, useRef, useState} from "react"

type Props<T> = {
	hierarchy: TableHierarchy<T>
	columns: TableColumnDefinition<T>[]
	dataSource: TableDataSource<T>
}

export const TableSegment = reactMemo(<T,>({
	hierarchy, dataSource, columns
}: Props<T>) => {
	const {loadNextRows} = dataSource
	const [segmentData, setSegmentData] = useState<T[]>([])
	const segmentDataRef = useRef(segmentData)
	segmentDataRef.current = segmentData

	const loadMore = useCallback(async() => {
		const {newRows, isThereMore} = await loadNextRows(hierarchy, segmentDataRef.current)
		setSegmentData(oldRows => [...oldRows, ...newRows])
		return isThereMore
	}, [loadNextRows, hierarchy])

	const rowsWithHierarchy = useMemo(() =>
		segmentData.map((row, index) => ({row, hierarchy: [...hierarchy, {row, rowIndex: index, parentLoadedRowsCount: segmentData.length}]}))
	, [segmentData, hierarchy])

	return (
		<TableInfiniteScroll onBottomHit={loadMore} triggerOffsetPx={50}>
			{rowsWithHierarchy.map(({row, hierarchy}, index) => (
				<TableRow
					key={dataSource.getRowKey(row, index)}
					hierarchy={hierarchy}
					columns={columns}
					dataSource={dataSource}
				/>
			))}
		</TableInfiniteScroll>
	)
})
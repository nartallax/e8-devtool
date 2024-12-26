import {TableBottomHitEvent, TableHierarchy, TableProps, TableRow} from "client/components/table/table"
import {TableIntersectionTrigger} from "client/components/table/table_intersection_trigger"
import {TableRowCells} from "client/components/table/table_row"
import {reactMemo} from "common/react_memo"
import {useMemo, useState} from "react"

type Props<K extends string> = {
	segmentData: readonly TableRow<K>[]
	hierarchy: TableHierarchy<K>
	draggedRowHierarchyTail: TableHierarchy<K> | null
	isRowCurrentlyDragged: boolean
} & Pick<TableProps<K>, "columns" | "onBottomHit">

export const TableRowSequence = reactMemo(<K extends string>({
	segmentData, hierarchy, columns, draggedRowHierarchyTail, isRowCurrentlyDragged, onBottomHit
}: Props<K>) => {
	const [isExpectingMoreRows, setExpectingMoreRows] = useState(!!onBottomHit)

	// we need to compare current bottom row with row that was bottom when we started loading rows
	// this way we are absolutely sure that we will start loading new rows strictly after old rows are loaded
	// (we are allowing to load new rows only when current bottom row is not equal to previously used bottom row)
	// if we don't do that - sometimes intersection trigger calls for new page before react propagates changes to state
	// which causes onBottomHit to be invoked with old list of currently known rows, which can cause request for the same page again
	const [lastBottomRowKey, setLastBottomRowKey] = useState<string | number | null>(null)
	const currentBottomRowKey = segmentData[segmentData.length - 1]?.key

	const loadMoreRows = useMemo(() => !onBottomHit ? undefined : async() => {
		const evt: TableBottomHitEvent<K> = {
			hierarchy,
			knownRows: segmentData,
			parentRow: hierarchy.length === 0 ? null : hierarchy[hierarchy.length - 1]!.row
		}
		const bottomRowIndex = evt.knownRows.length - 1
		const bottomRow = evt.knownRows[bottomRowIndex]
		setLastBottomRowKey(bottomRow?.key ?? null)
		setExpectingMoreRows(await Promise.resolve(onBottomHit(evt)))
	}, [onBottomHit, hierarchy, segmentData])

	const rowsWithHierarchy = useMemo(() =>
		segmentData.map((row, index) => ({
			row,
			hierarchy: [
				...hierarchy, {row, rowIndex: index, parentLoadedRowsCount: segmentData.length}
			]
		}))
	, [segmentData, hierarchy])

	return (
		<>
			{rowsWithHierarchy.map(({row, hierarchy}, index) => (
				<TableRowCells
					isRowCurrentlyDragged={isRowCurrentlyDragged}
					key={row.key}
					hierarchy={hierarchy}
					columns={columns}
					draggedRowHierarchyTail={draggedRowHierarchyTail?.[0]?.rowIndex !== index ? null : draggedRowHierarchyTail.slice(1)}
					onBottomHit={onBottomHit}
				/>
			))}
			{loadMoreRows && isExpectingMoreRows && <TableIntersectionTrigger
				canTrigger={currentBottomRowKey !== lastBottomRowKey}
				onBottomHit={loadMoreRows}
				triggerOffsetPx={50}
			/>}
		</>
	)
})
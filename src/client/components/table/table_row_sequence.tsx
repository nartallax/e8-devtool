import {TableBottomHitEvent, TableHierarchy, TableProps} from "client/components/table/table"
import {TableIntersectionTrigger} from "client/components/table/table_intersection_trigger"
import {TableRow} from "client/components/table/table_row"
import {reactMemo} from "common/react_memo"
import {useMemo, useState} from "react"

type Props<T> = {
	segmentData: readonly T[]
	hierarchy: TableHierarchy<T>
	draggedRowHierarchyTail: TableHierarchy<T> | null
	isRowCurrentlyDragged: boolean
} & Pick<TableProps<T>, "columns" | "getRowKey" | "onBottomHit" | "canHaveChildren" | "getChildren">

export const TableRowSequence = reactMemo(<T,>({
	segmentData, hierarchy, columns, draggedRowHierarchyTail, isRowCurrentlyDragged, getRowKey, onBottomHit, canHaveChildren, getChildren
}: Props<T>) => {
	const [isExpectingMoreRows, setExpectingMoreRows] = useState(!!onBottomHit)

	// we need to compare current bottom row with row that was bottom when we started loading rows
	// this way we are absolutely sure that we will start loading new rows strictly after old rows are loaded
	// (we are allowing to load new rows only when current bottom row is not equal to previously used bottom row)
	// if we don't do that - sometimes intersection trigger calls for new page before react propagates changes to state
	// which causes onBottomHit to be invoked with old list of currently known rows, which can cause request for the same page again
	const [lastBottomRowKey, setLastBottomRowKey] = useState<string | number | null>(null)
	const currentBottomRowIndex = segmentData.length - 1
	const currentBottomRow = segmentData[segmentData.length - 1]
	const currentBottomRowKey = !currentBottomRow ? undefined : getRowKey(currentBottomRow, currentBottomRowIndex)

	const loadMoreRows = useMemo(() => !onBottomHit ? undefined : async() => {
		const evt: TableBottomHitEvent<T> = {
			hierarchy,
			knownRows: segmentData,
			parentRow: hierarchy.length === 0 ? null : hierarchy[hierarchy.length - 1]!.row
		}
		const bottomRowIndex = evt.knownRows.length - 1
		const bottomRow = evt.knownRows[bottomRowIndex]
		setLastBottomRowKey(!bottomRow ? null : getRowKey(bottomRow, bottomRowIndex))
		setExpectingMoreRows(await Promise.resolve(onBottomHit(evt)))
	}, [onBottomHit, hierarchy, segmentData, getRowKey])

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
				<TableRow
					isRowCurrentlyDragged={isRowCurrentlyDragged}
					key={getRowKey(row, index)}
					hierarchy={hierarchy}
					columns={columns}
					draggedRowHierarchyTail={draggedRowHierarchyTail?.[0]?.rowIndex !== index ? null : draggedRowHierarchyTail.slice(1)}
					getRowKey={getRowKey}
					canHaveChildren={canHaveChildren}
					getChildren={getChildren}
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
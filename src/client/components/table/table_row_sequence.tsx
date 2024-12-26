import {TableBottomHitEvent, TableHierarchy, TableProps, TableRow} from "client/components/table/table"
import {TableIntersectionTrigger} from "client/components/table/table_intersection_trigger"
import {TableRowCells} from "client/components/table/table_row"
import {reactMemo} from "common/react_memo"
import {useMemo, useState} from "react"
import * as css from "./table.module.css"
import {sleepFrame} from "client/ui_utils/sleep_frame"

type Props<K extends string> = {
	segmentData: readonly TableRow<K>[]
	hierarchy: TableHierarchy<K>
	draggedRowHierarchyTail: TableHierarchy<K> | null
	isRowCurrentlyDragged: boolean
} & Pick<TableProps<K>, "columns" | "onBottomHit">

export const TableRowSequence = reactMemo(<K extends string>({
	segmentData, hierarchy, columns, draggedRowHierarchyTail, isRowCurrentlyDragged, onBottomHit
}: Props<K>) => {
	// we need to compare current bottom row with row that was bottom when we started loading rows
	// this way we are absolutely sure that we will start loading new rows strictly after old rows are loaded
	// (we are allowing to load new rows only when current bottom row is not equal to previously used bottom row)
	// if we don't do that - sometimes intersection trigger calls for new page before react propagates changes to state
	// which causes onBottomHit to be invoked with old list of currently known rows, which can cause request for the same page again
	const [lastBottomRowKey, setLastBottomRowKey] = useState<string | number | null>(null)
	const [isLoading, setIsLoading] = useState(false)
	const currentBottomRowKey = segmentData[segmentData.length - 1]?.key
	// after everything is loaded this boolean is expected to be true indefinitely
	const canLoadNextPage = currentBottomRowKey !== lastBottomRowKey

	const loadMoreRows = useMemo(() => !onBottomHit ? undefined : async() => {
		const evt: TableBottomHitEvent<K> = {
			hierarchy,
			knownRows: segmentData,
			parentRow: hierarchy.length === 0 ? null : hierarchy[hierarchy.length - 1]!.row
		}
		setLastBottomRowKey(evt.knownRows[evt.knownRows.length - 1]?.key ?? null)
		try {
			const resultPromise = onBottomHit(evt)
			// we set loading only after one frame to avoid flickering of "Loading..." row in case everything is loaded already
			await sleepFrame()
			setIsLoading(true)
			await resultPromise
		} finally {
			setIsLoading(false)
		}
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
			{isLoading && <div className={css.tableLoadingRow}/>}
			{loadMoreRows && !isLoading && canLoadNextPage && <TableIntersectionTrigger
				onBottomHit={loadMoreRows}
				triggerOffsetPx={50}
			/>}
		</>
	)
})
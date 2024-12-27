import {TableBottomHitEvent, TableHierarchy, TableProps, TableRow} from "client/components/table/table"
import {TableIntersectionTrigger} from "client/components/table/table_intersection_trigger"
import {TableRowCells} from "client/components/table/table_row"
import {reactMemo} from "common/react_memo"
import {Fragment, ReactNode, useMemo, useState} from "react"
import * as css from "./table.module.css"
import {sleepFrame} from "client/ui_utils/sleep_frame"
import {TableUtils} from "client/components/table/table_utils"
import {TableEditedRow} from "client/components/table/table_edited_row"

type Props<K extends string> = {
	segmentData: readonly TableRow<K>[]
	hierarchy: TableHierarchy<K>
	draggedRowHierarchyTail: TableHierarchy<K> | null
	isRowCurrentlyDragged: boolean
	editedRow?: readonly number[] | null
	completeEdit?: TableProps<K>["onEditCompleted"]
	isRowCreated: boolean
} & Pick<TableProps<K>, "columns" | "onBottomHit" | "getRowEditor">

export const TableRowSequence = reactMemo(<K extends string>({
	segmentData, hierarchy, columns, draggedRowHierarchyTail, isRowCurrentlyDragged, onBottomHit, editedRow, completeEdit, getRowEditor, isRowCreated
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

	const rowsWithHierarchy = useMemo(() => {
		let result: {row?: TableRow<K>, editor?: ReactNode, hierarchy?: TableHierarchy<K>}[] = segmentData.map((row, index) => ({
			row,
			hierarchy: [
				...hierarchy, {row, rowIndex: index, parentLoadedRowsCount: segmentData.length}
			]
		}))

		const isCreatedRowInThisSequence = isRowCreated
			&& !!editedRow
			&& editedRow?.length === hierarchy.length + 1
			&& TableUtils.locationMatchesHierarchy(editedRow.slice(0, editedRow.length - 1), hierarchy)
		console.log({isRowCreated, editedRow, hierarchy})
		const createdRowIndex = !isCreatedRowInThisSequence ? null : editedRow[editedRow.length - 1]!
		if(createdRowIndex !== null){
			const editor = (
				<TableEditedRow
					columns={columns}
					row={null}
					completeEdit={completeEdit}
					getRowEditor={getRowEditor}
					key="__new_row_editor"
					location={editedRow!}
				/>
			)
			result = [
				...result.slice(0, createdRowIndex),
				{editor},
				...result.slice(createdRowIndex)
			]
		}

		return result
	}, [segmentData, hierarchy, isRowCreated, editedRow, columns, completeEdit, getRowEditor])

	return (
		<>
			{rowsWithHierarchy.map(({row, editor, hierarchy}, index) => (
				<Fragment key={!row ? "__new_row_editor" : row.key}>
					{editor}
					{row && hierarchy && <TableRowCells
						isRowCurrentlyDragged={isRowCurrentlyDragged}
						hierarchy={hierarchy}
						columns={columns}
						draggedRowHierarchyTail={draggedRowHierarchyTail?.[0]?.rowIndex !== index ? null : draggedRowHierarchyTail.slice(1)}
						onBottomHit={onBottomHit}
						editedRow={editedRow}
						completeEdit={completeEdit}
						getRowEditor={getRowEditor}
						isRowCreated={isRowCreated}
					/>}
				</Fragment>
			))}
			{isLoading && <div className={css.tableLoadingRow}/>}
			{loadMoreRows && !isLoading && canLoadNextPage && <TableIntersectionTrigger
				onBottomHit={loadMoreRows}
				triggerOffsetPx={50}
			/>}
		</>
	)
})
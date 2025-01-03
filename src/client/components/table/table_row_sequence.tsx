import {TableBottomHitEvent, TableColumnDefinition, TableHierarchy, TableProps} from "client/components/table/table"
import {TableIntersectionTrigger} from "client/components/table/table_intersection_trigger"
import {TableRow} from "client/components/table/table_row"
import {reactMemo} from "common/react_memo"
import {Fragment, ReactNode, useMemo, useState} from "react"
import * as css from "./table.module.css"
import {sleepFrame} from "client/ui_utils/sleep_frame"
import {TableUtils} from "client/components/table/table_utils"
import {TableEditedRow} from "client/components/table/table_edited_row"

type Props<T> = {
	segmentData: readonly T[]
	hierarchy: TableHierarchy<T>
	draggedRowHierarchy: TableHierarchy<T> | null
	isRowCurrentlyDragged: boolean
	editedRow?: readonly number[] | null
	completeEdit?: TableProps<T>["onEditCompleted"]
	isRowCreated: boolean
	columns: readonly TableColumnDefinition<T>[]
} & Pick<TableProps<T>, "onBottomHit" | "getRowEditor" | "getChildren" | "getRowKey" | "selectedRows" | "setSelectedRows" | "rowCursor" | "setRowCursor">

export const TableRowSequence = reactMemo(<T,>({
	segmentData, hierarchy, columns, draggedRowHierarchy, isRowCurrentlyDragged, onBottomHit, editedRow, completeEdit, getRowEditor, getChildren, getRowKey, isRowCreated, selectedRows, setSelectedRows, rowCursor, setRowCursor
}: Props<T>) => {
	// we need to compare current bottom row with row that was bottom when we started loading rows
	// this way we are absolutely sure that we will start loading new rows strictly after old rows are loaded
	// (we are allowing to load new rows only when current bottom row is not equal to previously used bottom row)
	// if we don't do that - sometimes intersection trigger calls for new page before react propagates changes to state
	// which causes onBottomHit to be invoked with old list of currently known rows, which can cause request for the same page again
	const [lastBottomRowKey, setLastBottomRowKey] = useState<string | number | null>(null)
	const [isLoading, setIsLoading] = useState(false)
	const [hasCalledLoadOnce, setHasCalledLoadOnce] = useState(false)
	const currentBottomIndex = segmentData.length - 1
	const currentBottomRowKey = segmentData.length === 0 ? null : getRowKey(segmentData[currentBottomIndex]!, currentBottomIndex)
	// after everything is loaded this boolean is expected to be true indefinitely
	const canLoadNextPage = currentBottomRowKey !== lastBottomRowKey || !hasCalledLoadOnce

	const loadMoreRows = useMemo(() => !onBottomHit ? undefined : async() => {
		setHasCalledLoadOnce(true)
		const evt: TableBottomHitEvent<T> = {
			hierarchy,
			knownRows: segmentData,
			parentRow: hierarchy.length === 0 ? null : hierarchy[hierarchy.length - 1]!.row
		}
		const bottomIndex = evt.knownRows.length - 1
		setLastBottomRowKey(evt.knownRows.length === 0 ? null : getRowKey(evt.knownRows[bottomIndex]!, bottomIndex))
		try {
			const resultPromise = onBottomHit(evt)
			// we set loading only after one frame to avoid flickering of "Loading..." row in case everything is loaded already
			const res = await Promise.race([sleepFrame("frame_passed_first"), resultPromise])
			if(res === "frame_passed_first"){
				setIsLoading(true)
			}
			await resultPromise
		} finally {
			setIsLoading(false)
		}
	}, [onBottomHit, hierarchy, segmentData, getRowKey])

	const rowsWithHierarchy = useMemo(() => {
		let result: {row?: T, editor?: ReactNode, hierarchy?: TableHierarchy<T>}[] = segmentData.map((row, index) => ({
			row,
			hierarchy: [
				...hierarchy, {row, rowIndex: index, parentLoadedRowsCount: segmentData.length}
			]
		}))

		const isCreatedRowInThisSequence = isRowCreated
			&& !!editedRow
			&& editedRow?.length === hierarchy.length + 1
			&& TableUtils.locationMatchesHierarchy(editedRow.slice(0, editedRow.length - 1), hierarchy)
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
				<Fragment key={!row ? "__new_row_editor" : getRowKey(row, index)}>
					{editor}
					{row && hierarchy && <TableRow
						isRowCurrentlyDragged={isRowCurrentlyDragged}
						hierarchy={hierarchy}
						columns={columns}
						draggedRowHierarchy={draggedRowHierarchy}
						onBottomHit={onBottomHit}
						editedRow={editedRow}
						completeEdit={completeEdit}
						getRowEditor={getRowEditor}
						isRowCreated={isRowCreated}
						getChildren={getChildren}
						getRowKey={getRowKey}
						selectedRows={selectedRows}
						setSelectedRows={setSelectedRows}
						rowCursor={rowCursor}
						setRowCursor={setRowCursor}
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
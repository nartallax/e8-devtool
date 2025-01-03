import {TableProps} from "client/components/table/table"
import {TableUtils} from "client/components/table/table_utils"
import {nodeOrParentThatMatches} from "client/ui_utils/dom_queries"
import {SetState} from "client/ui_utils/react_types"
import {KeyboardEvent, MouseEvent, TouchEvent} from "react"

type Props<T> = Pick<TableProps<T>, "setRowCursor" | "selectedRows" | "setSelectedRows" | "rows" | "getChildren" | "rowCursor"> & {
	lastSelectionStart: readonly number[] | null
	setLastSelectionStart: SetState<readonly number[] | null>
}

export const useTableCursorSelectionHandlers = <T>({
	lastSelectionStart, setLastSelectionStart, rowCursor, setRowCursor, selectedRows, setSelectedRows, rows, getChildren
}: Props<T>) => {
	if(!setRowCursor && !setSelectedRows){
		return {}
	}

	const moveSelectionTo = (target: Node, src: readonly number[] | null, dest: readonly number[], withShift: boolean) => {
		if(setRowCursor){
			setRowCursor(dest)
			const cell = TableUtils.getAnyRowCellByLocation(target, dest)
			const cellRect = cell.getBoundingClientRect()
			const table = TableUtils.findParentTable(target)
			const tableRect = table.getBoundingClientRect()
			const headers = TableUtils.getHeadersRow(target)
			const headersHeight = !headers ? 0 : headers.getBoundingClientRect().height
			const visibleTop = tableRect.top + headersHeight
			if(cellRect.top < visibleTop){
				table.scrollTop -= visibleTop - cellRect.top
			} else if(cellRect.bottom > tableRect.bottom){
				table.scrollTop += cellRect.bottom - tableRect.bottom
			}
		}

		if(setSelectedRows){
			if(!withShift){
				setLastSelectionStart(dest)
				setSelectedRows({firstRow: dest, count: 1})
				return
			}

			let effLastSelectionStart = lastSelectionStart ?? src ?? dest
			if(!lastSelectionStart || lastSelectionStart.length !== dest.length){
				effLastSelectionStart = src ?? dest
				setLastSelectionStart(effLastSelectionStart)
			}
			const startIndex = effLastSelectionStart[effLastSelectionStart.length - 1]!
			const currentIndex = dest[dest.length - 1]!
			if(startIndex >= currentIndex){
				setSelectedRows({firstRow: dest, count: startIndex - currentIndex + 1})
			} else {
				setSelectedRows({firstRow: effLastSelectionStart, count: currentIndex - startIndex + 1})
			}
		}
	}

	const moveCursorByOffset = (target: Node, offset: number, withShift: boolean) => {
		const effRowCursor = rowCursor ?? lastSelectionStart ?? selectedRows?.firstRow
		if(!effRowCursor || effRowCursor.length === 0){
			if(rows.length === 0){
				return
			}
			moveSelectionTo(target, null, [0], withShift)
			return
		}

		const newCursor = [...effRowCursor]
		let lastIndex = newCursor[newCursor.length - 1]!
		lastIndex += offset
		let lowestLevelRows: readonly T[]
		if(effRowCursor.length < 2){
			lowestLevelRows = rows
		} else {
			const parentRow = TableUtils.findParentRowOrThrow(rows, getChildren, effRowCursor)
			lowestLevelRows = getChildren?.(parentRow) ?? []
		}
		lastIndex = Math.max(0, Math.min(lowestLevelRows.length - 1, lastIndex))
		newCursor[newCursor.length - 1] = lastIndex
		moveSelectionTo(target, effRowCursor, newCursor, withShift)
	}

	const onPointerEvent = (e: MouseEvent | TouchEvent) => {
		const target = e.nativeEvent.target
		if(!(target instanceof Node)){
			return
		}
		if(nodeOrParentThatMatches(target, isInteractiveElement)){
			return
		}
		const rowPath = TableUtils.findNearestRowPath(target)
		if(!rowPath){
			return
		}
		moveSelectionTo(target, null, rowPath, e.shiftKey)
	}

	const cancelSelectionIfShift = (e: MouseEvent | TouchEvent) => {
		if(e.shiftKey){
			e.preventDefault()
		}
	}

	return {
		onMouseDown: cancelSelectionIfShift,
		onTouchStart: cancelSelectionIfShift,
		onMouseUp: onPointerEvent,
		onTouchEnd: onPointerEvent,
		onKeyDown: !setRowCursor ? undefined : (e: KeyboardEvent) => {
			let moveDirection = 0
			const target = e.nativeEvent.target
			if(!(target instanceof Node)){
				return
			}
			if(e.key === "ArrowDown"){
				moveDirection = 1
			} else if(e.key === "ArrowUp"){
				moveDirection = -1
			}
			if(moveDirection !== 0){
				e.preventDefault()
				moveCursorByOffset(target, moveDirection, e.shiftKey)
			}
		}
	}

}

const isInteractiveElement = (x: Node): boolean => x.nodeName === "INPUT" || x.nodeName === "TEXTAREA" || x.nodeName === "BUTTON"
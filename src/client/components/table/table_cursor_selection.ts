import {TableProps} from "client/components/table/table"
import {TableUtils} from "client/components/table/table_utils"
import {nodeOrParentThatMatches} from "client/ui_utils/dom_queries"
import {KeyboardEvent, MouseEvent, TouchEvent, useState} from "react"

type Props<T> = Pick<TableProps<T>, "setRowCursor" | "setSelectedRows" | "rows" | "getChildren" | "rowCursor">

export const useTableCursorSelectionHandlers = <T>({
	rowCursor, setRowCursor, setSelectedRows, rows, getChildren
}: Props<T>) => {
	const [lastSelectionStart, setLastSelectionStart] = useState<readonly number[] | null>(null)
	if(!setRowCursor && !setSelectedRows){
		return {}
	}

	const moveSelectionTo = (target: Node, loc: readonly number[], withShift: boolean) => {
		if(setRowCursor){
			setRowCursor(loc)
			const cell = TableUtils.getAnyRowCellByLocation(target, loc)
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
			if(!withShift || !lastSelectionStart || lastSelectionStart.length !== loc.length){
				setLastSelectionStart(loc)
				setSelectedRows({firstRow: loc, count: 1})
				return
			}

			const startIndex = lastSelectionStart[lastSelectionStart.length - 1]!
			const currentIndex = loc[loc.length - 1]!
			if(startIndex >= currentIndex){
				setSelectedRows({firstRow: loc, count: startIndex - currentIndex + 1})
			} else {
				setSelectedRows({firstRow: lastSelectionStart, count: currentIndex - startIndex + 1})
			}
		}
	}

	const moveCursorByOffset = (target: Node, offset: number, withShift: boolean) => {
		if(!rowCursor || rowCursor.length === 0){
			if(rows.length === 0){
				return
			}
			moveSelectionTo([0], withShift)
			return
		}

		const newCursor = [...rowCursor]
		let lastIndex = newCursor[newCursor.length - 1]!
		lastIndex += offset
		let lowestLevelRows: readonly T[]
		if(rowCursor.length < 2){
			lowestLevelRows = rows
		} else {
			const parentRow = TableUtils.findParentRowOrThrow(rows, getChildren, rowCursor)
			lowestLevelRows = getChildren?.(parentRow) ?? []
		}
		lastIndex = Math.max(0, Math.min(lowestLevelRows.length - 1, lastIndex))
		newCursor[newCursor.length - 1] = lastIndex
		moveSelectionTo(target, newCursor, withShift)
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
		if(e.shiftKey){
			e.preventDefault()
		}
		moveSelectionTo(target, rowPath, e.shiftKey)
	}

	return {
		onMouseDown: onPointerEvent,
		onTouchStart: onPointerEvent,
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
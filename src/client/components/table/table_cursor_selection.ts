import {TableProps} from "client/components/table/table"
import {TableExpansionTree} from "client/components/table/table_expansion_tree"
import {TableUtils} from "client/components/table/table_utils"
import {nodeOrParentThatMatches} from "client/ui_utils/dom_queries"
import {SetState} from "client/ui_utils/react_types"
import {KeyboardEvent, MouseEvent, TouchEvent} from "react"

type Props<T> = Pick<TableProps<T>, "setRowCursor" | "selectedRows" | "setSelectedRows" | "rows" | "getChildren" | "rowCursor"> & {
	lastSelectionStart: readonly number[] | null
	setLastSelectionStart: SetState<readonly number[] | null>
	expTree: TableExpansionTree
	setExpTree: SetState<TableExpansionTree>
}

export const useTableCursorSelectionHandlers = <T>({
	lastSelectionStart, setLastSelectionStart, rowCursor, setRowCursor, selectedRows, setSelectedRows, rows, getChildren, expTree, setExpTree
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
			if(!withShift || (src && src?.length !== dest.length)){
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

	const tryMoveCursorUpLevel = (newCursor: number[]): number[] | null => {
		const lowestLevelRows = TableUtils.getSiblings(rows, getChildren, newCursor)
		if(newCursor[newCursor.length - 1]! > lowestLevelRows.length - 1){
			if(newCursor.length === 1){
				newCursor[newCursor.length - 1] = lowestLevelRows.length - 1
				return newCursor
			}

			const cursorUpLevel = newCursor.slice(0, newCursor.length - 1)
			const rowsUpLevel = TableUtils.getSiblings(rows, getChildren, cursorUpLevel)
			const lastIndexUpLevel = cursorUpLevel[cursorUpLevel.length - 1]! + 1
			if(lastIndexUpLevel <= rowsUpLevel.length - 1){
				newCursor = cursorUpLevel
				newCursor[newCursor.length - 1] = lastIndexUpLevel
				return newCursor
			}
		} else if(newCursor[newCursor.length - 1]! < 0){
			if(newCursor.length === 1){
				newCursor[newCursor.length - 1] = 0
				return newCursor
			}

			newCursor = newCursor.slice(0, newCursor.length - 1)
			return newCursor
		}

		return null
	}

	const tryMoveCursorDownLevel = (newCursor: number[], offset: -1 | 1): number[] | null => {
		if(offset > 0 && expTree.has(newCursor)){
			const row = TableUtils.findRowOrThrow(rows, getChildren, newCursor)
			const children = getChildren?.(row)
			if(children && children.length > 0){
				newCursor.push(0)
				return newCursor
			}
		}

		if(offset > 0){
			return null // try other forms of movement
		}

		if(newCursor[newCursor.length - 1]! > 0){
			const prevRowCursor = [...newCursor]
			prevRowCursor[prevRowCursor.length - 1]!--
			if(!expTree.has(prevRowCursor)){
				return null
			}

			const row = TableUtils.findRowOrThrow(rows, getChildren, prevRowCursor)
			const children = getChildren?.(row)
			if(children && children.length > 0){
				newCursor = prevRowCursor
				newCursor.push(children.length - 1)
				return newCursor
			}

		}

		return null
	}

	const moveCursorByOffset = (target: Node, offset: -1 | 1, withShift: boolean) => {
		const effRowCursor = rowCursor ?? lastSelectionStart ?? selectedRows?.firstRow
		if(!effRowCursor || effRowCursor.length === 0){
			if(rows.length === 0){
				return
			}
			moveSelectionTo(target, null, [0], withShift)
			return
		}

		let newCursor = [...effRowCursor]
		const downleveledCursor = tryMoveCursorDownLevel(newCursor, offset)
		if(downleveledCursor){
			newCursor = downleveledCursor
		} else {
			newCursor[newCursor.length - 1]! += offset
			newCursor = tryMoveCursorUpLevel(newCursor) ?? newCursor
		}

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
			let moveDirection: -1 | 1 | 0 = 0
			const target = e.nativeEvent.target
			if(!(target instanceof Node)){
				return
			}

			if(e.key === "ArrowDown"){
				moveDirection = 1
			} else if(e.key === "ArrowUp"){
				moveDirection = -1
			} else if(e.key === "Escape"){
				setSelectedRows?.(null)
				setRowCursor?.(null)
			}

			if(moveDirection !== 0){
				e.preventDefault()
				moveCursorByOffset(target, moveDirection, e.shiftKey)
			}
		}
	}

}

const isInteractiveElement = (x: Node): boolean => x.nodeName === "INPUT" || x.nodeName === "TEXTAREA" || x.nodeName === "BUTTON"
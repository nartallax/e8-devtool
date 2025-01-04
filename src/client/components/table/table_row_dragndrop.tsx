import {TableProps, TableRowMoveEvent, TableRowSequenceDesignator} from "client/components/table/table"
import {useEffect, useState} from "react"
import * as css from "./table.module.css"
import {SetState} from "client/ui_utils/react_types"
import {makeTableDrag} from "client/components/table/table_generic_drag"
import {TableUtils} from "client/components/table/table_utils"
import {reactMemo} from "common/react_memo"
import {useRefValue} from "common/ref_value"
import {TableExpansionTree} from "client/components/table/table_expansion_tree"
import {sleepFrame} from "client/ui_utils/sleep_frame"
import {setStateAndReturn} from "client/ui_utils/set_state_and_return"

type RowDragDisposition = "above" | "below" | "inside"
type XY = {x: number, y: number}

type Props<T> = {
	tableId: string
	setCurrentlyDraggedRows: SetState<TableRowSequenceDesignator | null>
	setLastSelectionStart: SetState<readonly number[] | null>
	setExpTree: SetState<TableExpansionTree>
} & Pick<TableProps<T>, "rows" | "canMoveRowTo" | "onRowMoved" | "getChildren" | "selectedRows" | "setSelectedRows" | "setRowCursor">

export const TableRowDragndrop = reactMemo(<T,>({
	setLastSelectionStart, selectedRows, setSelectedRows, rows: data, setCurrentlyDraggedRows, tableId, canMoveRowTo, onRowMoved, getChildren, setRowCursor, setExpTree
}: Props<T>) => {
	const [cursorOffset, setCursorOffset] = useState<XY | null>(null)
	const [dropLocatorY, setDropLocatorY] = useState<number | null>(null)
	// we must not re-create drag handlers each time selected rows change
	// because they could change mid-drag
	const selectedRowsRef = useRefValue(selectedRows)

	useEffect(() => {
		if(!onRowMoved){
			return undefined
		}

		let lastCheckedTargetLocation: readonly number[] | null = null
		let destinationLocation: readonly number[] | null = null
		let sourceLocation: TableRowSequenceDesignator | null = null

		const makeMoveEvent = (sourceLocation: TableRowSequenceDesignator, targetLocation: TableRowSequenceDesignator): TableRowMoveEvent<T> => {
			const oldParent = sourceLocation.firstRow.length < 2 ? null : TableUtils.findParentRowOrThrow(data, getChildren, sourceLocation.firstRow)
			const newParent = targetLocation.firstRow.length < 2 ? null : TableUtils.findParentRowOrThrow(data, getChildren, targetLocation.firstRow)
			return {
				oldLocation: sourceLocation,
				newLocation: targetLocation,
				oldParent,
				newParent,
				rows: TableUtils.designatorToRows(targetLocation, data, getChildren)
			}
		}

		const tryUpdateTargetLocation = (coords: XY, target: HTMLElement) => {
			if(!coords || !sourceLocation){
				return
			}

			const newTarget = findNearestCell(target, tableId)
			if(!newTarget){
				return
			}
			const {path: newTargetLocation} = newTarget

			let disposition: RowDragDisposition
			const newTargetRow = TableUtils.findRowOrThrow(data, getChildren, newTargetLocation)
			const newTargetRect = newTarget.el.getBoundingClientRect()
			const ratio = (coords.y - newTargetRect.top) / newTargetRect.height
			if(getChildren?.(newTargetRow)){
				disposition = ratio < 0.25 ? "above" : ratio > 0.75 ? "below" : "inside"
			} else {
				disposition = ratio < 0.5 ? "above" : "below"
			}

			if(disposition === "below"){
				newTargetLocation[newTargetLocation.length - 1]!++
			} else if(disposition === "inside"){
				newTargetLocation.push(0)
			}

			if(lastCheckedTargetLocation && TableUtils.locationsAreEqual(lastCheckedTargetLocation, newTargetLocation)){
				// we have already checked that location and either set it to target or refused to
				return
			}

			lastCheckedTargetLocation = newTargetLocation
			const targetDesignator: TableRowSequenceDesignator = {firstRow: newTargetLocation, count: sourceLocation.count}
			if(isRowMoveLegal(sourceLocation.firstRow, newTargetLocation) && (canMoveRowTo?.(makeMoveEvent(sourceLocation, targetDesignator)) ?? true)){
				destinationLocation = newTargetLocation
				setDropLocatorY(targetToLocatorY(target, disposition))
			}
		}

		const {onDown, cleanup} = makeTableDrag({
			thresholdPx: 5,
			direction: "vertical",
			canStartAt: coords => !!findNearestCell(coords.target, tableId),
			reset: reason => {
				destinationLocation = null
				lastCheckedTargetLocation = null
				sourceLocation = null
				setCursorOffset(null)
				setDropLocatorY(null)
				if(reason !== "end"){
					setCurrentlyDraggedRows(null)
				}
			},
			onStart: coords => {
				const rowElWithPath = findNearestCell(coords.target, tableId)!
				const selectedRows = selectedRowsRef.current
				setRowCursor?.(null)
				if(selectedRows && TableUtils.isLocationIncludedInDesignator(rowElWithPath.path, selectedRows)){
					sourceLocation = selectedRows
				} else {
					setSelectedRows?.(null)
					sourceLocation = {firstRow: rowElWithPath.path, count: 1}
				}
				destinationLocation = sourceLocation.firstRow
				setCurrentlyDraggedRows(sourceLocation)
			},
			onMove: ({start, current}) => {
				setCursorOffset(getCursorOffset(start.target, current))
				tryUpdateTargetLocation(current, current.target)
			},
			onEnd: async({end}) => {
				tryUpdateTargetLocation(end, end.target)
				// we need to save those into separate variables, because reset() will be called syncronously after this function
				const src = sourceLocation
				const dest = destinationLocation
				try {
					if(src && dest && !TableUtils.locationsAreEqual(src.firstRow, dest)){
						const destDesignator: TableRowSequenceDesignator = {firstRow: dest, count: src.count}

						// preparation before move
						const selectedRows = selectedRowsRef.current
						if(selectedRows){
							setSelectedRows?.(null)
						}
						setRowCursor?.(null)
						setLastSelectionStart(null)
						const expandedOffsets = await setStateAndReturn(setExpTree, expTree => {
							// if we don't do anything to expansion tree - indices will be all wrong
							// so here we are doing two things
							// 1. saving expanded rows (in form of offsets),
							// removing them from tree,
							// and adding them back (adjusted for new location) after move
							// 2. notifying tree that its offsets have been shifted
							const expandedOffsets = expTree.getPresentDesignatorPathOffsets(src)
							const updatedTree = expTree.removeDesignator(src)
							return [updatedTree, expandedOffsets]
						})

						// the move
						await onRowMoved(makeMoveEvent(src, destDesignator))

						// restoring proper values after the move
						const updatedDestDesignator = TableUtils.updateMoveDesignator(src, destDesignator)
						const areDestRowsVisible = await setStateAndReturn(setExpTree, expTree => {
							expTree = expTree.shiftIndicesByDesignator(src, -1)
							expTree = expTree.shiftIndicesByDesignator(destDesignator, 1)
							for(const offset of expandedOffsets){
								const newExpandedPath = [...updatedDestDesignator.firstRow]
								newExpandedPath[newExpandedPath.length - 1]! += offset
								expTree = expTree.add(newExpandedPath)
							}

							const areDestRowsVisible = selectedRows && expTree.hasParent(updatedDestDesignator.firstRow)
							return [expTree, areDestRowsVisible]
						})

						if(selectedRows && areDestRowsVisible){
							setSelectedRows?.(updatedDestDesignator)
						}
					}
				} finally {
					setCurrentlyDraggedRows(null)
				}
			}
		})

		// it's a bit of performance problem, to add listeners like this globally
		// however, this allows us to pack most of this drag-n-drop functionality just within this one component
		// also this could allow for drag-n-drop between different tables, would we ever need that
		// (and it's not that big of a deal, we won't ever have a lot of tables simultaneously anyway)
		window.addEventListener("mousedown", onDown, {passive: true})
		window.addEventListener("touchstart", onDown, {passive: true})

		return () => {
			window.removeEventListener("mousedown", onDown)
			window.removeEventListener("touchstart", onDown)
			cleanup("shutdown")
		}
	}, [tableId, data, selectedRowsRef, setLastSelectionStart, setCurrentlyDraggedRows, onRowMoved, canMoveRowTo, getChildren, setSelectedRows, setRowCursor, setExpTree])

	return (
		<>
			{dropLocatorY !== null && <div
				className={css.moveDropLocator}
				style={{
					["--drop-locator-y"]: dropLocatorY + "px"
				} as any}
			/>}
			{cursorOffset && <div
				className={css.moveRowCursor}
				style={{
					["--cursor-x"]: cursorOffset.x + "px",
					["--cursor-y"]: cursorOffset.y + "px"
				} as any}
			/>}
		</>
	)
})

const findNearestCell = (el: HTMLElement, tableId: string): {el: HTMLElement, path: number[]} | null => {
	while(el !== document.body){
		const attr = el.getAttribute("data-tree-path")
		if(attr){
			if(!isCellBelongsToTable(el, tableId)){
				return null
			}
			return {el, path: JSON.parse(attr)}
		}
		if(!el.parentElement){
			return null
		}
		el = el.parentElement
	}
	return null
}

const isCellBelongsToTable = (cell: HTMLElement, tableId: string): boolean => {
	return TableUtils.findParentTable(cell).getAttribute("data-table-id") === tableId
}

const getCursorOffset = (cell: HTMLElement, coords: XY): XY | null => {
	const table = TableUtils.findParentTable(cell)
	const tableRect = table.getBoundingClientRect()
	return {
		x: (coords.x - tableRect.left) + table.scrollLeft,
		y: (coords.y - tableRect.top) + table.scrollTop
	}
}

const targetToLocatorY = (target: HTMLElement, disposition: RowDragDisposition) => {
	const table = TableUtils.findParentTable(target)
	const tableRect = table.getBoundingClientRect()
	const targetRect = target.getBoundingClientRect()

	let result = targetRect.top - tableRect.top + table.scrollTop
	if(disposition === "inside"){
		result += targetRect.height / 2
	} else if(disposition === "below"){
		result += targetRect.height
	}
	return result
}

const isRowMoveLegal = (from: readonly number[], to: readonly number[]): boolean => {
	if(from.length === to.length){
		// even if it's the same position - who cares
		return true
	}
	if(isStartsWith(to, from)){
		return false // cannot move row into itself
	}
	return true
}

const isStartsWith = <T,>(long: readonly T[], short: readonly T[]): boolean => {
	for(let i = 0; i < short.length; i++){
		if(long[i] !== short[i]){
			return false
		}
	}
	return true
}
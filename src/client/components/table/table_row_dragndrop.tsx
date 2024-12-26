import {TableHierarchy, TableProps, TableRowMoveEvent} from "client/components/table/table"
import {useEffect, useState} from "react"
import * as css from "./table.module.css"
import {SetState} from "client/ui_utils/react_types"
import {findParentTable, makeTableDrag} from "client/components/table/table_generic_drag"
import {TableUtils} from "client/components/table/table_utils"

type RowDragDisposition = "above" | "below" | "inside"
type XY = {x: number, y: number}

type Props<T> = {
	tableId: string
	setCurrentlyDraggedRow: SetState<TableHierarchy<T> | null>
} & Pick<TableProps<T>, "data" | "canHaveChildren" | "getChildren" | "canMoveRowTo" | "onRowMoved">

export const TableRowDragndrop = <T,>({
	data, setCurrentlyDraggedRow, tableId, canHaveChildren, getChildren, canMoveRowTo, onRowMoved
}: Props<T>) => {
	const [cursorOffset, setCursorOffset] = useState<XY | null>(null)
	const [dropLocatorY, setDropLocatorY] = useState<number | null>(null)

	useEffect(() => {
		if(!onRowMoved){
			return undefined
		}

		let lastCheckedTargetLocation: number[] | null = null
		let destinationLocation: number[] | null = null
		let sourceLocation: TableHierarchy<T> | null = null

		const makeMoveEvent = (sourceLocation: TableHierarchy<T>, targetLocation: number[]): TableRowMoveEvent<T> => ({
			oldLocation: sourceLocation.map(x => x.rowIndex),
			newLocation: targetLocation,
			oldParent: sourceLocation[sourceLocation.length - 2]?.row ?? null,
			newParent: targetLocation.length < 2 ? null : TableUtils.findParentRowOrThrow(data, getChildren, targetLocation),
			row: sourceLocation[sourceLocation.length - 1]!.row
		})

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
			if(canHaveChildren?.(newTargetRow)){
				disposition = ratio < 0.25 ? "above" : ratio > 0.75 ? "below" : "inside"
			} else {
				disposition = ratio < 0.5 ? "above" : "below"
			}

			if(disposition === "below"){
				newTargetLocation[newTargetLocation.length - 1]!++
			} else if(disposition === "inside"){
				newTargetLocation.push(0)
			}

			if(lastCheckedTargetLocation && arePathsEqual(lastCheckedTargetLocation, newTargetLocation)){
				// we have already checked that location and either set it to target or refused to
				return
			}

			lastCheckedTargetLocation = newTargetLocation
			if(isRowMoveLegal(sourceLocation.map(x => x.rowIndex), newTargetLocation) && (canMoveRowTo?.(makeMoveEvent(sourceLocation, newTargetLocation)) ?? true)){
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
					setCurrentlyDraggedRow(null)
				}
			},
			onStart: coords => {
				const rowElWithPath = findNearestCell(coords.target, tableId)!
				sourceLocation = TableUtils.pathToHierarchy(data, getChildren, rowElWithPath.path)
				destinationLocation = sourceLocation.map(x => x.rowIndex)
				setCurrentlyDraggedRow(sourceLocation)
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
					if(src && dest && !arePathsEqual(src.map(x => x.rowIndex), dest)){
						await onRowMoved(makeMoveEvent(src, dest))
					}
				} finally {
					setCurrentlyDraggedRow(null)
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
	}, [tableId, data, setCurrentlyDraggedRow, onRowMoved, canHaveChildren, canMoveRowTo, getChildren])

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
}

const arePathsEqual = (a: number[], b: number[]): boolean => {
	if(a.length !== b.length){
		return false
	}
	for(let i = 0; i < a.length; i++){
		if(a[i] !== b[i]){
			return false
		}
	}
	return true
}

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
	return findParentTable(cell).getAttribute("data-table-id") === tableId
}

const getCursorOffset = (cell: HTMLElement, coords: XY): XY | null => {
	const table = findParentTable(cell)
	const tableRect = table.getBoundingClientRect()
	return {
		x: (coords.x - tableRect.left) + table.scrollLeft,
		y: (coords.y - tableRect.top) + table.scrollTop
	}
}

const targetToLocatorY = (target: HTMLElement, disposition: RowDragDisposition) => {
	const table = findParentTable(target)
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

const isRowMoveLegal = (from: number[], to: number[]): boolean => {
	if(from.length === to.length){
		// even if it's the same position - who cares
		return true
	}
	if(isStartsWith(to, from)){
		return false // cannot move row into itself
	}
	return true
}

const isStartsWith = <T,>(long: T[], short: T[]): boolean => {
	for(let i = 0; i < short.length; i++){
		if(long[i] !== short[i]){
			return false
		}
	}
	return true
}
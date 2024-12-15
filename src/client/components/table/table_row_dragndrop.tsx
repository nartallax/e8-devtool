import {TableHierarchy} from "client/components/table/table"
import {TableDataSource} from "client/components/table/table_data_source"
import {useEffect, useState} from "react"
import * as css from "./table.module.css"
import {SetState} from "client/ui_utils/react_types"

type XY = {x: number, y: number}

type XYAndTarget = XY & {
	target: HTMLElement
}

type Props<T> = {
	tableId: string
	dataSource: TableDataSource<T>
	setCurrentlyDraggedRow: SetState<TableHierarchy<T> | null>
}

const moveDistanceBeforeDragStart = 5

export const TableRowDragndrop = <T,>({
	setCurrentlyDraggedRow, dataSource, tableId
}: Props<T>) => {
	const [cursorOffset, setCursorOffset] = useState<XY | null>(null)
	const [dropLocatorY, setDropLocatorY] = useState<number | null>(null)

	useEffect(() => {
		if(!dataSource.areRowsMovable){
			return undefined
		}

		const elToHierarchy = (el: HTMLElement): TableHierarchy<T> | null => {
			const rowElWithPath = findNearestCell(el, tableId)
			if(!rowElWithPath){
				return null
			}
			return dataSource.treePathToHierarchy(rowElWithPath.path)
		}

		const makeMoveEvent = (sourceLocation: TableHierarchy<T>, targetLocation: TableHierarchy<T>) => ({
			oldLocation: sourceLocation,
			newLocation: targetLocation,
			oldParent: sourceLocation[sourceLocation.length - 2]?.row ?? null,
			newParent: targetLocation[targetLocation.length - 2]?.row ?? null,
			row: sourceLocation[sourceLocation.length - 1]!.row
		})

		const cleanup = (cleanupCurrentlyDraggedRow = true) => {
			window.removeEventListener("mousemove", onMove)
			window.removeEventListener("touchmove", onMove)
			window.removeEventListener("mouseup", onUp)
			window.removeEventListener("touchend", onUp)
			dragStartCoords = null
			destinationLocation = null
			lastCheckedTargetLocation = null
			sourceLocation = null
			isMoving = false
			setCursorOffset(null)
			setDropLocatorY(null)
			if(cleanupCurrentlyDraggedRow){
				setCurrentlyDraggedRow(null)
			}
		}

		let dragStartCoords: XYAndTarget | null = null
		let lastCheckedTargetLocation: TableHierarchy<T> | null = null
		let destinationLocation: TableHierarchy<T> | null = null
		let sourceLocation: TableHierarchy<T> | null = null
		let isMoving = false

		const tryUpdateTargetLocation = (coords: XYAndTarget | null) => {
			if(!coords || !sourceLocation){
				return
			}

			const newTargetLocation = elToHierarchy(coords.target)
			if(newTargetLocation){
				if(lastCheckedTargetLocation && areHierarchiesEqual(lastCheckedTargetLocation, newTargetLocation)){
					// we have already checked that location and either set it to target or refused to
					return
				}
				lastCheckedTargetLocation = newTargetLocation
				if(dataSource.canMoveRowTo(makeMoveEvent(sourceLocation, newTargetLocation))){
					destinationLocation = newTargetLocation
					setDropLocatorY(targetToLocatorY(coords.target))
				}
			}
		}

		const onDown = (e: TouchEvent | MouseEvent) => {
			const coords = extractCoordsAndTarget(e)
			if(!coords){
				return
			}
			const rowElWithPath = findNearestCell(coords.target, tableId)
			if(!rowElWithPath){
				return // clicked on something that is not row
			}

			cleanup()
			dragStartCoords = coords
			sourceLocation = dataSource.treePathToHierarchy(rowElWithPath.path)
			window.addEventListener("mousemove", onMove, {passive: true})
			window.addEventListener("touchmove", onMove, {passive: true})
			window.addEventListener("mouseup", onUp, {passive: true})
			window.addEventListener("touchend", onUp, {passive: true})
		}

		const onMove = (e: TouchEvent | MouseEvent) => {
			const coords = extractCoordsAndTarget(e)
			if(!coords || !dragStartCoords || !sourceLocation){
				return
			}

			if(!isMoving){
				const dx = Math.abs(coords.x - dragStartCoords.x)
				const dy = Math.abs(coords.y - dragStartCoords.y)
				const distance2 = dx * dy
				if(distance2 < moveDistanceBeforeDragStart ** 2){
					return
				}
				if(dx > dy){
					// that's not vertical drag, but rather some other drag. we don't need to handle that gesture
					cleanup()
					return
				}

				// move actually starts here
				isMoving = true
				destinationLocation = sourceLocation
				setCurrentlyDraggedRow(sourceLocation)
				window.getSelection()?.removeAllRanges()
			}

			setCursorOffset(eventToCursorOffset(dragStartCoords.target, e))

			tryUpdateTargetLocation(coords)
		}

		const onUp = async(e: TouchEvent | MouseEvent) => {
			if(!isMoving){
				// this could happen in case of a short click (with movement less than move threshold)
				cleanup()
				return
			}
			tryUpdateTargetLocation(extractCoordsAndTarget(e))
			const src = sourceLocation
			const dest = destinationLocation
			cleanup(false)

			try {
				if(src && dest && !areHierarchiesEqual(src, dest)){
					await dataSource.onRowMoved(makeMoveEvent(src, dest))
				}
			} finally {
				setCurrentlyDraggedRow(null)
			}
		}

		// it's a bit of performance problem, to add listeners like this globally
		// however, this allows us to pack most of this drag-n-drop functionality just within this one component
		// also this could allow for drag-n-drop between different tables, would we ever need that
		window.addEventListener("mousedown", onDown, {passive: true})
		window.addEventListener("touchstart", onDown, {passive: true})

		return () => {
			window.removeEventListener("mousedown", onDown)
			window.removeEventListener("touchstart", onDown)
			cleanup()
		}
	}, [dataSource, tableId, setCurrentlyDraggedRow])

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

const findNearestHtmlElement = (target: unknown): HTMLElement | null => {
	while(!!target && typeof(target) === "object"){
		if(target instanceof HTMLElement){
			return target
		}

		if("parent" in target && target.parent !== target){
			target = target.parent
			continue
		}

		return null
	}
	return null
}

const areHierarchiesEqual = <T,>(a: TableHierarchy<T>, b: TableHierarchy<T>): boolean => {
	if(a.length !== b.length){
		return false
	}
	for(let i = 0; i < a.length; i++){
		if(a[i]!.rowIndex !== b[i]!.rowIndex){
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

const findParentTable = (child: HTMLElement): HTMLElement => {
	let el: Element = child
	while(el !== document.body){
		const attrValue = el.getAttribute("data-table-id")
		if(attrValue){
			return el as HTMLElement
		}
		if(!el.parentElement){
			break
		}
		el = el.parentElement
	}
	throw new Error("Table element not found.")
}

const isCellBelongsToTable = (cell: HTMLElement, tableId: string): boolean => {
	return findParentTable(cell).getAttribute("data-table-id") === tableId
}

const eventToCursorOffset = (cell: HTMLElement, event: TouchEvent | MouseEvent): XY | null => {
	const coords = extractCoordsAndTarget(event)
	if(!coords){
		return null
	}

	const table = findParentTable(cell)
	const tableRect = table.getBoundingClientRect()
	return {
		x: (coords.x - tableRect.left) + table.scrollLeft,
		y: (coords.y - tableRect.top) + table.scrollTop
	}
}

const targetToLocatorY = (target: HTMLElement) => {
	const table = findParentTable(target)
	const tableRect = table.getBoundingClientRect()
	const targetRect = target.getBoundingClientRect()

	return targetRect.top - tableRect.top + table.scrollTop
}

const isTouchEvent = (evt: TouchEvent | MouseEvent): evt is TouchEvent => "touches" in evt
const extractCoordsAndTarget = (event: TouchEvent | MouseEvent): XYAndTarget | null => {
	let x: number
	let y: number
	let eventTarget: EventTarget | null
	if(isTouchEvent(event)){
		const anyTouch = event.touches[0]
		if(!anyTouch){
			return null
		}
		x = anyTouch.clientX
		y = anyTouch.clientY
		eventTarget = anyTouch.target
	} else {
		x = event.clientX
		y = event.clientY
		eventTarget = event.target
	}

	const htmlTarget = findNearestHtmlElement(eventTarget)
	if(!htmlTarget){
		return null
	}

	return {x, y, target: htmlTarget}
}
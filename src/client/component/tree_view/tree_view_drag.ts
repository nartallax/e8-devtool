import {tag} from "@nartallax/cardboard-dom"
import {TreeViewRowData} from "client/component/tree_view/tree_view"
import {Icon} from "generated/icons"
import {MouseDragHandlers, addMouseDragHandler, pointerEventsToClientCoords} from "common/mouse_drag"
import * as css from "./tree_view.module.scss"
import {Tree} from "common/tree"
import {WBox, isWBox} from "@nartallax/cardboard"

type XY = {x: number, y: number}

type DragDestinationDisposition = "above" | "below" | "inside"

type TreePosition = {
	parentId: string | null
	index: number
}

export interface TreeViewDragHandlers<T, B> {
	attachDragHandlers: (row: TreeViewRowData<T, B>) => void
	cancelCurrentDrag: () => void
}

interface Params {
	restrictToParent?: boolean
}

export function makeTreeViewDragAttacher<T, B>(root: HTMLElement, allRowsById: ReadonlyMap<string, TreeViewRowData<T, B>>, data: WBox<readonly Tree<T, B>[]>, {restrictToParent}: Params = {}): TreeViewDragHandlers<T, B> {
	let dragDestination: {row: TreeViewRowData<T, B>, disposition: DragDestinationDisposition} | null = null
	let draggedRow: TreeViewRowData<T, B> | null = null
	let lastKnownMouseEvent: MouseEvent | TouchEvent | null = null

	const dragDestinationMarker = tag({class: css.dragDestinationMarker}, [
		tag({class: Icon.arrowRight}),
		tag({tag: "hr"}),
		tag({class: Icon.arrowLeft})
	])

	function getElCenter(el: HTMLElement): XY {
		// doing it with rect is required to account for scroll and other movements of the whole list during the drag
		const elRect = el.getBoundingClientRect()
		return {
			x: Math.floor((elRect.left + elRect.right) / 2),
			y: Math.floor((elRect.top + elRect.bottom) / 2)
		}
	}

	function updateTopLeftOfDraggedElement(el: HTMLElement, e: MouseEvent | TouchEvent): void {
		const elCenterCoords = getElCenter(el)
		const absCoords = pointerEventsToClientCoords(e)
		const coordsAdjustment = {x: absCoords.x - elCenterCoords.x, y: absCoords.y - elCenterCoords.y}
		el.style.left = (parseInt(el.style.left || "0") + coordsAdjustment.x) + "px"
		el.style.top = (parseInt(el.style.top || "0") + coordsAdjustment.y) + "px"
	}

	function setDragDestination(target: TreeViewRowData<T, B>, targetRect: DOMRect, disposition: DragDestinationDisposition): void {
		dragDestination = {row: target, disposition}
		dragDestinationMarker.style.top = (calcMarkerTop(targetRect, disposition) + root.scrollTop) + "px"
	}

	function calcMarkerTop(targetRect: DOMRect, disposition: DragDestinationDisposition): number {
		const rootRect = root.getBoundingClientRect()
		switch(disposition){
			case "above": return targetRect.top - rootRect.top
			case "below": return targetRect.bottom - rootRect.top
			case "inside": return Math.floor((targetRect.top + targetRect.bottom) / 2) - rootRect.top
		}
	}

	function updateDataByDrag(): void {
		if(!dragDestination || !draggedRow){
			return
		}

		const oldPosition = getTreePosition(draggedRow)
		const newPosition = getTreePosition(dragDestination.row)

		if(dragDestination.disposition === "inside"){
			newPosition.parentId = dragDestination.row.id
			newPosition.index = 0
		}
		if(dragDestination.disposition === "below"){
			newPosition.index++
		}
		if(newPosition.parentId === oldPosition.parentId && oldPosition.index < newPosition.index){
			newPosition.index--
		}
		if(newPosition.parentId === draggedRow.id){
			return // don't insert into itself
		}

		if(oldPosition.parentId === newPosition.parentId && oldPosition.index === newPosition.index){
			return
		}

		const rowData = draggedRow.box.get()


		const newParentChildBox = newPosition.parentId === null ? data : allRowsById.get(newPosition.parentId)!.childBox!
		const oldParentChildBox = oldPosition.parentId === null ? data : allRowsById.get(oldPosition.parentId)!.childBox!
		if(!isWBox(newParentChildBox) || !isWBox(oldParentChildBox)){
			throw new Error("How it's not wbox?")
		}

		oldParentChildBox.deleteElementAtIndex(oldPosition.index)
		newParentChildBox.insertElementAtIndex(newPosition.index, rowData)
	}

	function updateDragDestination(e: MouseEvent | TouchEvent, staleCoords: boolean): void {
		const targetRow = allRowsById.get(getRowIdByEvent(e, staleCoords)!)
		if(!targetRow){
			return
		}
		const coords = pointerEventsToClientCoords(e)
		const targetRect = targetRow.rowEl.getBoundingClientRect()
		const targetOffset = coords.y - targetRect.top
		const targetHeightRate = targetOffset / targetRect.height
		if(targetRow.isBranch && targetHeightRate > 0.25 && targetHeightRate < 0.75 && !restrictToParent){
			setDragDestination(targetRow, targetRect, "inside")
		} else {
			if(restrictToParent && getTreePosition(targetRow).parentId !== getTreePosition(draggedRow!).parentId){
				return
			}
			setDragDestination(targetRow, targetRect, targetHeightRate < 0.5 ? "above" : "below")
		}
	}

	function onMouseMove(e: MouseEvent | TouchEvent, staleCoords = false): void {
		lastKnownMouseEvent = e
		updateTopLeftOfDraggedElement(draggedRow!.rowEl, e)
		updateDragDestination(e, staleCoords)
	}

	function cleanupDrag(): void {
		if(draggedRow){
			draggedRow.rowEl.classList.remove(css.currentlyDraggedRow!)
			draggedRow.rowEl.style.top = ""
			draggedRow.rowEl.style.left = ""
			draggedRow = null
		}
		lastKnownMouseEvent = null
		dragDestination = null
		dragDestinationMarker.remove()
	}

	function addDragHandlers(row: TreeViewRowData<T, B>): void {
		const handlers: MouseDragHandlers = addMouseDragHandler({
			element: row.rowEl,
			distanceBeforeMove: 5,
			start: e => {
				if(row.isExpanded.get()){
					return false
				}
				requestAnimationFrame(() => {
					if(!row.el.isConnected){
						cleanupDrag()
						handlers.cancelCurrent()
					}
				})
				row.rowEl.classList.add(css.currentlyDraggedRow!)
				dragDestination = null
				draggedRow = row
				onMouseMove(e, false)
				root.appendChild(dragDestinationMarker)
				return true
			},
			stop: () => {
				updateDataByDrag()
				cleanupDrag()
			},
			onMove: onMouseMove
		})
	}

	root.addEventListener("scroll", () => {
		if(lastKnownMouseEvent){
			onMouseMove(lastKnownMouseEvent, true)
		}
	}, {passive: true})

	return {
		attachDragHandlers: addDragHandlers,
		cancelCurrentDrag: cleanupDrag
	}
}

const getRowIdByEvent = (e: MouseEvent | TouchEvent, isStale: boolean): string | null => {
	let node: unknown = e.target
	if(isStale){
		const coords = pointerEventsToClientCoords(e)
		node = document.elementFromPoint(coords.x, coords.y)
	}
	return getRowIdByNode(node)
}

const getRowIdByNode = (node: unknown): string | null => {
	while(node && node !== document.body){
		if(node instanceof HTMLElement){
			const id = node.getAttribute("data-row-id")
			if(id !== null){
				return id
			}
		}

		if(node instanceof Node){
			node = node.parentNode
			continue
		}
		return null
	}

	return null
}

const getTreePosition = <T, B>(row: TreeViewRowData<T, B>): TreePosition => {
	const parent = row.el.parentElement
	if(!parent){
		throw new Error("Row node is not attached to the DOM.")
	}

	let index = -1
	for(let i = 0; i < parent.children.length; i++){
		if(parent.children[i] === row.el){
			index = i
			break
		}
	}
	if(index === -1){
		throw new Error("Failed to find index of row among parent children")
	}

	return {parentId: getRowIdByNode(parent), index}
}
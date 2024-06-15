import {WorkbenchPositionState} from "client/components/workbench/workbench"
import {lockUserSelect, unlockUserSelect} from "client/ui_utils/user_select_lock"
import {addMouseDragHandler} from "common/mouse_drag"
import {RefObject, useEffect} from "react"

type SetterFn<T> = (callback: (value: T) => T) => void

type Props = {
	setBenchState: SetterFn<WorkbenchPositionState>
	zoomSpeed: number
	zoomMin: number
	zoomMax: number
	rootRef: RefObject<HTMLElement | null>
	pointerEventToWorkbenchCoords: (e: MouseEvent | TouchEvent, zoom?: number, x?: number, y?: number) => {x: number, y: number}
}

export const useWorkbenchInput = ({setBenchState, rootRef, pointerEventToWorkbenchCoords, zoomSpeed, zoomMin, zoomMax}: Props) => {
	useEffect(() => {
		const root = rootRef.current
		if(!root){
			return
		}

		const wheelHandler = (e: WheelEvent) => {
			setBenchState(({x, y, zoom}) => {
				const mult = 1 + (e.deltaY < 0 ? 1 : -1) * zoomSpeed
				let newZoom = zoom
				if((newZoom < 1 && newZoom * mult > 1) || (newZoom > 1 && newZoom * mult < 1)){
					// breakpoint. always stop for zoom = 1
					newZoom = 1
				} else {
					newZoom *= mult
				}
				newZoom = Math.max(zoomMin, Math.min(zoomMax, newZoom))

				const zoomPointCoordsBeforeZoom = pointerEventToWorkbenchCoords(e, zoom)
				const zoomPointCoordsAfterZoom = pointerEventToWorkbenchCoords(e, newZoom)
				const dx = zoomPointCoordsBeforeZoom.x - zoomPointCoordsAfterZoom.x
				const dy = zoomPointCoordsBeforeZoom.y - zoomPointCoordsAfterZoom.y
				return {
					zoom: newZoom,
					x: x - dx,
					y: y - dy
				}
			})
		}

		let startCursorPos = {x: 0, y: 0}
		let startCenterPos = {x: 0, y: 0}
		const mouseDrag = addMouseDragHandler({
			distanceBeforeMove: 2,
			element: root,
			start: e => {
				// TODO: overlays...?
				// if(e.target !== container && !hasParent(e.target, contentPlain)){
				// // this prevents drag from start on overlay items
				// // which is usually the right thing to do
				// 	return false
				// }
				setBenchState(({x, y, zoom}) => {
					startCursorPos = pointerEventToWorkbenchCoords(e)
					startCenterPos = {x, y}
					return {x, y, zoom}
				})
				lockUserSelect()
				return true
			},
			stop: () => {
				unlockUserSelect()
			},
			onMove: e => {
				setBenchState(({zoom}) => {
					const curCursorPos = pointerEventToWorkbenchCoords(e, zoom, startCenterPos.x, startCenterPos.y)
					const dx = startCursorPos.x - curCursorPos.x
					const dy = startCursorPos.y - curCursorPos.y
					return {
						zoom,
						x: startCenterPos.x - dx,
						y: startCenterPos.y - dy
					}
				})
			}
		})

		root.addEventListener("wheel", wheelHandler, {passive: true})
		return () => {
			mouseDrag.detach()
			root.removeEventListener("wheel", wheelHandler)
		}
	}, [setBenchState, rootRef, zoomMax, zoomMin, zoomSpeed, pointerEventToWorkbenchCoords])
}
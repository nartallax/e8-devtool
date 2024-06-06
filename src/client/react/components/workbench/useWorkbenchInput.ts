import {lockUserSelect, unlockUserSelect} from "client/react/uiUtils/userSelectLock"
import {addMouseDragHandler, pointerEventsToOffsetCoords} from "common/mouse_drag"
import {RefObject, useEffect} from "react"

type SetterFn<T> = (callback: (value: T) => T) => void

type Props = {
	setBenchState: SetterFn<{x: number, y: number, zoom: number}>
	zoomSpeed: number
	zoomMin: number
	zoomMax: number
	rootRef: RefObject<HTMLElement | null>
	rootSize: {width: number, height: number}
	contentWidth: number
	contentHeight: number
}

export const useWorkbenchInput = ({setBenchState, rootRef, rootSize, zoomSpeed, zoomMin, zoomMax, contentWidth, contentHeight}: Props) => {
	useEffect(() => {
		const root = rootRef.current
		if(!root){
			return
		}

		const pointerEventToWorkbenchCoords = (e: MouseEvent | TouchEvent, x: number, y: number, zoom: number) => {
			const coords = pointerEventsToOffsetCoords(e, root)!
			coords.x -= rootSize.width / 2
			coords.y -= rootSize.height / 2
			coords.x -= contentWidth / 2
			coords.y -= contentHeight / 2
			coords.x /= zoom
			coords.y /= zoom
			coords.x += contentWidth
			coords.y += contentHeight
			coords.x -= x
			coords.y -= y
			return coords
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

				const zoomPointCoordsBeforeZoom = pointerEventToWorkbenchCoords(e, x, y, zoom)
				const zoomPointCoordsAfterZoom = pointerEventToWorkbenchCoords(e, x, y, newZoom)
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
			onClick: e => setBenchState(({x, y, zoom}) => {
				console.log(pointerEventToWorkbenchCoords(e, x, y, zoom))
				return {x, y, zoom}
			}),
			start: e => {
				// TODO: overlays...?
				// if(e.target !== container && !hasParent(e.target, contentPlain)){
				// // this prevents drag from start on overlay items
				// // which is usually the right thing to do
				// 	return false
				// }
				setBenchState(({x, y, zoom}) => {
					startCursorPos = pointerEventToWorkbenchCoords(e, x, y, zoom)
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
					const curCursorPos = pointerEventToWorkbenchCoords(e, startCenterPos.x, startCenterPos.y, zoom)
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
	}, [setBenchState, rootRef, zoomMax, zoomMin, zoomSpeed, rootSize, contentWidth, contentHeight])
}
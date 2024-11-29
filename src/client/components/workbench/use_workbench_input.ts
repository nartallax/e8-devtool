import {WorkbenchPositionState} from "client/components/workbench/workbench"
import {AnyPointerEvent, useMouseDragProps} from "client/ui_utils/use_mouse_drag"
import {lockUserSelect, unlockUserSelect} from "client/ui_utils/user_select_lock"
import {useCallback, useRef} from "react"

type SetterFn<T> = (callback: (value: T) => T) => void

type Props = {
	setBenchState: SetterFn<WorkbenchPositionState>
	zoomSpeed: number
	zoomMin: number
	zoomMax: number
	pointerEventToWorkbenchCoords: (e: AnyPointerEvent, zoom?: number) => {x: number, y: number}
}

export const useWorkbenchInputProps = ({
	setBenchState, pointerEventToWorkbenchCoords, zoomSpeed, zoomMin, zoomMax
}: Props) => {
	const wheelHandler = useCallback((e: React.WheelEvent | WheelEvent) => {
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
	}, [pointerEventToWorkbenchCoords, setBenchState, zoomMax, zoomMin, zoomSpeed])

	const dragStart = useRef({x: 0, y: 0})

	const dragProps = useMouseDragProps({
		distanceBeforeMove: 2,
		start: () => {
			setBenchState(state => {
				dragStart.current.x = state.x
				dragStart.current.y = state.y
				return state
			})
			lockUserSelect()
		},
		stop: unlockUserSelect,
		onMove: (_, {diff: {x: dx, y: dy}}) => {
			setBenchState(({zoom}) => {
				return {
					zoom,
					x: dragStart.current.x - dx / zoom,
					y: dragStart.current.y - dy / zoom
				}
			})
		}
	})

	return {
		...dragProps,
		onWheel: wheelHandler
	}
}
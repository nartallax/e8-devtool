import {AnyPointerEvent} from "client/ui_utils/use_mouse_drag"
import {UUID} from "common/uuid"

export const isModelShapeNodeAddDeleteEvent = (e: AnyPointerEvent): boolean => e.ctrlKey || e.metaKey
export const getModelShapeNodeTargetIds = (e: AnyPointerEvent): ({shapeId: UUID, pointIndex: number} | null) => {
	let el = e.target
	while(el instanceof SVGElement){
		const shapeId = el.getAttribute("data-shape-id")
		const pointIndex = el.getAttribute("data-point-index")
		if(shapeId && pointIndex){
			return {shapeId: shapeId as UUID, pointIndex: parseInt(pointIndex)}
		}
		el = el.parentElement
	}
	return null
}
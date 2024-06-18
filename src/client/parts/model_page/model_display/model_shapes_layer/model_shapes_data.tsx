import {UUID} from "common/uuid"

// TODO: rename, too common
export const isAddDeleteEvent = (e: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent): boolean => e.ctrlKey || e.metaKey
export const getTargetIds = (e: MouseEvent | TouchEvent): ({shapeId: UUID, pointIndex: number} | null) => {
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
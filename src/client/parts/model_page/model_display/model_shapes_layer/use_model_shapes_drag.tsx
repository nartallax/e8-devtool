import {useModelDisplayContext} from "client/parts/model_page/model_display/model_display_context"
import {getModelShapeNodeTargetIds, isModelShapeNodeAddDeleteEvent} from "client/parts/model_page/model_display/model_shapes_layer/model_shapes_data"
import {useMouseDragProps} from "client/ui_utils/use_mouse_drag"
import {useRef} from "react"

type MovingPointData = {
	startX: number
	startY: number
	lastX: number
	lastY: number
}

export const useModelShapesDragProps = () => {
	const {getShapes, updateShapes, shapesStateStack, mouseEventToInworldCoords, currentlyDrawnShapeId, setCurrentlyDrawnShapeId, selectedPointRef, selectedShapeId, setSelectedShapeId} = useModelDisplayContext()

	const movingPointRef = useRef<MovingPointData>({
		startX: 0,
		startY: 0,
		lastX: 0,
		lastY: 0
	})

	return useMouseDragProps({
		start: e => {
			const targetIds = getModelShapeNodeTargetIds(e)
			if(!targetIds){
				return false
			}

			const {shapeId, pointIndex} = selectedPointRef.current = {
				pointIndex: targetIds.pointIndex,
				shapeId: targetIds.shapeId
			}

			const shape = getShapes().find(shape => shape.id === shapeId)
			if(!shape){
				throw new Error("No shape for id = " + shapeId)
			}

			if(isModelShapeNodeAddDeleteEvent(e)){
				e.preventDefault()
				e.stopPropagation()
				if(shape.points.length < 4){
					if(selectedShapeId === shapeId){
						setSelectedShapeId(null)
					}
					updateShapes(shapes => shapes.filter(shape => shape.id !== shapeId))
				} else {
					updateShapes(shapes => shapes.map(shape => shape.id !== shapeId ? shape : {
						...shape,
						points: shape.points.filter((_, i) => i !== pointIndex)
					}))
				}
				shapesStateStack.storeState(getShapes())
				return false
			}

			if(currentlyDrawnShapeId === shapeId){
				// closing the loop
				const shape = getShapes().find(shape => shape.id === currentlyDrawnShapeId)
				if((shape?.points.length ?? 0) < 3){
					// no single-dimension shapes
					updateShapes(shapes => shapes.filter(shape => shape.id !== currentlyDrawnShapeId))
				} else {
					shapesStateStack.storeState(getShapes())
				}

				setCurrentlyDrawnShapeId(null)
				return false
			}

			const {x, y} = mouseEventToInworldCoords(e)
			movingPointRef.current.startX = x
			movingPointRef.current.startY = y

			return true
		},

		onMove: e => {
			const selectedPoint = selectedPointRef.current
			if(!selectedPoint){
				// what
				console.error("Expected to have moving point state")
				return
			}

			const {x, y} = mouseEventToInworldCoords(e)
			movingPointRef.current.lastX = x
			movingPointRef.current.lastY = y
			updateShapes(shapes => shapes.map(shape => shape.id !== selectedPoint.shapeId ? shape : {
				...shape,
				points: shape.points.map((point, i) => i !== selectedPoint.pointIndex ? point : [x, y])
			}))
		},

		stop: () => {
			const movingPointState = movingPointRef.current
			if(!movingPointState){
				// what
				console.error("Expected to have moving point state")
				return
			}

			if(
				movingPointState.startX !== movingPointState.lastX
					|| movingPointState.startY !== movingPointState.lastY){
				shapesStateStack.storeState(getShapes(), {type: "mouse_move"})
			}
		}
	})
}
import {useModelDisplayContext} from "client/parts/model_page/model_display/model_display_context"
import {getTargetIds, isAddDeleteEvent} from "client/parts/model_page/model_display/model_shapes_layer/model_shapes_data"
import {addMouseDragHandler} from "common/mouse_drag"
import {RefObject, useEffect} from "react"

export const useModelShapesDrag = (rootRef: RefObject<HTMLElement | SVGElement>) => {
	const {getShapes, updateShapes, shapesStateStack, mouseEventToInworldCoords, currentlyDrawnShapeId, setCurrentlyDrawnShapeId, movingPointStateRef, selectedShapeId, setSelectedShapeId} = useModelDisplayContext()

	// TODO: make a hook out of this ffs
	useEffect(() => {
		const root = rootRef.current
		if(!root){
			throw new Error("No root!")
		}

		const dragHandler = addMouseDragHandler({
			element: root,
			start: e => {
				const targetIds = getTargetIds(e)
				if(!targetIds){
					return false
				}

				const movingPointState = movingPointStateRef.current = {
					lastX: 0,
					lastY: 0,
					startX: 0,
					startY: 0,
					pointIndex: targetIds.pointIndex,
					shapeId: targetIds.shapeId
				}

				const shape = getShapes().find(shape => shape.id === movingPointState.shapeId)
				if(!shape){
					throw new Error("No shape for id = " + movingPointState.shapeId)
				}

				if(isAddDeleteEvent(e)){
					e.preventDefault()
					e.stopPropagation()
					if(shape.points.length < 4){
						if(selectedShapeId === movingPointState.shapeId){
							setSelectedShapeId(null)
						}
						updateShapes(shapes => shapes.filter(shape => shape.id !== movingPointState.shapeId))
					} else {
						updateShapes(shapes => shapes.map(shape => shape.id !== movingPointState.shapeId ? shape : {
							...shape,
							points: shape.points.filter((_, i) => i !== movingPointState.pointIndex)
						}))
					}
					shapesStateStack.storeState(getShapes())
					return false
				}

				if(currentlyDrawnShapeId === movingPointState.shapeId){
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

				const [x, y] = shape.points[movingPointState.pointIndex]!
				movingPointState.startX = x
				movingPointState.lastY = y
				return true
			},

			onMove: e => {
				const movingPointState = movingPointStateRef.current
				if(!movingPointState){
					// what
					console.error("Expected to have moving point state")
					return
				}

				const {x, y} = mouseEventToInworldCoords(e)
				movingPointState.lastX = x
				movingPointState.lastY = y
				// TODO: this feels wasteful, to update whole project while moving just one point in one model
				// that's a lot of copying in some cases
				// let's make model editing only actually update project on explicit save?
				// and have a warning on navigation about unsaved changes
				// and asterisk in the title
				updateShapes(shapes => shapes.map(shape => shape.id !== movingPointState.shapeId ? shape : {
					...shape,
					points: shape.points.map((point, i) => i !== movingPointState.pointIndex ? point : [x, y])
				}))
			},

			stop: () => {
				const movingPointState = movingPointStateRef.current
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

		return () => dragHandler.detach()
	}, [setSelectedShapeId, setCurrentlyDrawnShapeId, currentlyDrawnShapeId, mouseEventToInworldCoords, shapesStateStack, updateShapes, selectedShapeId, getShapes, movingPointStateRef, rootRef])
}
import {useModelDisplayContext} from "client/parts/model_page/model_display/model_display_context"
import {findPointInsertionIndex} from "client/parts/model_page/model_display/model_display_data"
import {isModelShapeNodeAddDeleteEvent} from "client/parts/model_page/model_display/model_shapes_layer/model_shapes_data"
import {useMemo} from "react"

export const useAddNodeProps = () => {
	const {
		shapesStateStack, updateShapes, getShapes, mouseEventToInworldCoords, currentlyDrawnShapeId, selectedShapeId
	} = useModelDisplayContext()

	const onMouseDown = useMemo(() => {
		const addNodeAt = (e: MouseEvent | React.MouseEvent) => {
			if(selectedShapeId === null){
				return
			}

			const clickCoords = mouseEventToInworldCoords(e)
			updateShapes(shapes => shapes.map(shape => {
				if(shape.id !== selectedShapeId){
					return shape
				}
				let points = shape.points
				const index = findPointInsertionIndex(points, clickCoords)
				points = [...points.slice(0, index), [clickCoords.x, clickCoords.y], ...points.slice(index)]
				return {...shape, points}
			}))

			shapesStateStack.storeState(getShapes())
		}

		const drawNodeAt = (e: MouseEvent | React.MouseEvent) => {
			if(currentlyDrawnShapeId === null){
				return
			}

			const clickCoords = mouseEventToInworldCoords(e)
			updateShapes(shapes => shapes.map(shape => {
				if(shape.id !== currentlyDrawnShapeId){
					return shape
				}
				return {...shape, points: [...shape.points, [clickCoords.x, clickCoords.y]]}
			}))
			shapesStateStack.storeState(getShapes())
		}

		return (e: React.MouseEvent) => {
			if(isModelShapeNodeAddDeleteEvent(e)){
				e.preventDefault()
				e.stopPropagation()
				addNodeAt(e)
			} else {
				drawNodeAt(e)
			}
		}
	}, [shapesStateStack, updateShapes, getShapes, mouseEventToInworldCoords, currentlyDrawnShapeId, selectedShapeId])

	return {onMouseDown}
}
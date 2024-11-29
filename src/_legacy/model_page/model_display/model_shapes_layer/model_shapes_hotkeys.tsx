import {useModelDisplayContext} from "_legacy/model_page/model_display/model_display_context"
import {Hotkey} from "client/components/hotkey_context/hotkey_context"
import {isArrowKeypress, isRedoKeypress, isUndoKeypress} from "client/components/hotkey_context/hotkey_utils"
import {PropsWithChildren} from "react"

export const ModelShapesHotkeys = ({children}: PropsWithChildren) => {
	const {
		getShapes, updateShapes, shapesStateStack, selectedShapeId, setSelectedShapeId, selectedPointRef, inworldUnitPixelSize
	} = useModelDisplayContext()

	const moveSelectedPoint = (e: KeyboardEvent) => {
		if(!inworldUnitPixelSize){
			return
		}
		const movingPointState = selectedPointRef.current!
		const step = 1 / inworldUnitPixelSize
		const shape = getShapes().find(shape => shape.id === movingPointState.shapeId)!
		let [x, y] = shape.points[movingPointState.pointIndex]!
		switch(e.code){
			case "ArrowLeft": x -= step; break
			case "ArrowRight": x += step; break
			case "ArrowUp": y -= step; break
			case "ArrowDown": y += step; break
			default: // pass through
		}
		updateShapes(shapes => shapes.map(shape => shape.id !== movingPointState.shapeId ? shape : {
			...shape,
			points: shape.points.map((point, i) => i !== movingPointState.pointIndex ? point : [x, y])
		}))
		if(shapesStateStack.peekMeta()?.type === "keyboard_move"){
			// compressing multiple keyboard movements into single state
			// this will make undoing easier, and also won't overblow memory consumption
			shapesStateStack.undo()
		}
		shapesStateStack.storeState(getShapes(), {type: "keyboard_move"})
	}

	return (
		<Hotkey
			shouldPick={e => isUndoKeypress(e) && shapesStateStack.canUndo()}
			onPress={() => {
				updateShapes(() => shapesStateStack.undo())
			}}>
			<Hotkey
				shouldPick={e => isRedoKeypress(e) && shapesStateStack.canRedo()}
				onPress={() => {
					updateShapes(() => shapesStateStack.redo())
				}}>
				<Hotkey
					shouldPick={e => e.key === "Delete" && selectedShapeId !== null}
					onPress={() => {
						updateShapes(shapes => shapes.filter(shape => shape.id !== selectedShapeId))
						shapesStateStack.storeState(getShapes())
						setSelectedShapeId(null)
					}}>
					<Hotkey
						shouldPick={e => isArrowKeypress(e) && (selectedPointRef.current?.pointIndex ?? -1) >= 0}
						onPress={moveSelectedPoint}>
						{children}
					</Hotkey>
				</Hotkey>
			</Hotkey>
		</Hotkey>
	)
}
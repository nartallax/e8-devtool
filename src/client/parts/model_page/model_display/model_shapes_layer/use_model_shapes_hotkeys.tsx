import {useHotkey} from "client/components/hotkey_context/hotkey_context"
import {isRedoKeypress, isUndoKeypress} from "client/components/hotkey_context/hotkey_utils"
import {useConfig} from "client/parts/config_context"
import {useModelDisplayContext} from "client/parts/model_page/model_display/model_display_context"
import {RefObject} from "react"

export const useModelShapesHotkeys = (rootRef: RefObject<HTMLElement | SVGElement>) => {
	const {getShapes, updateShapes, shapesStateStack, selectedShapeId, setSelectedShapeId, movingPointStateRef} = useModelDisplayContext()
	const {inworldUnitPixelSize} = useConfig()

	useHotkey({
		ref: rootRef,
		shouldPick: (e: KeyboardEvent) => isUndoKeypress(e) && shapesStateStack.canUndo(),
		onPress: () => {
			updateShapes(() => shapesStateStack.undo())
		}
	})

	useHotkey({
		ref: rootRef,
		shouldPick: (e: KeyboardEvent) => isRedoKeypress(e) && shapesStateStack.canRedo(),
		onPress: () => {
			updateShapes(() => shapesStateStack.redo())
		}
	})

	useHotkey({
		ref: rootRef,
		shouldPick: (e: KeyboardEvent) => e.key === "Delete" && selectedShapeId !== null,
		onPress: () => {
			updateShapes(shapes => shapes.filter(shape => shape.id !== selectedShapeId))
			shapesStateStack.storeState(getShapes())
			setSelectedShapeId(null)
		}
	})

	useHotkey({
		ref: rootRef,
		shouldPick: (e: KeyboardEvent) => (e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === "ArrowUp") && (movingPointStateRef.current?.pointIndex ?? -1) >= 0,
		onPress: e => {
			const movingPointState = movingPointStateRef.current!
			const step = 1 / inworldUnitPixelSize
			const shape = getShapes().find(shape => shape.id === movingPointState.shapeId)!
			let [x, y] = shape.points[movingPointState.pointIndex]!
			switch(e.code){
				case "ArrowLeft": x -= step; break
				case "ArrowRight": x += step; break
				case "ArrowUp": y -= step; break
				case "ArrowDown": y += step; break
			}
			movingPointState.lastX = x
			movingPointState.lastY = y
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
	})
}
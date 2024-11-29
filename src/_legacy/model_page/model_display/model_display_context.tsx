import {XY} from "@nartallax/e8"
import {WorkbenchContextValue} from "client/components/workbench/workbench_context"
import {modelProvider} from "client/parts/data_providers/data_providers"
import {defineContext} from "client/ui_utils/define_context"
import {SetState} from "client/ui_utils/react_types"
import {StateStack} from "client/ui_utils/state_stack"
import {AnyPointerEvent} from "client/ui_utils/use_mouse_drag"
import {UUID} from "common/uuid"
import {ProjectConfig, ProjectModel, ProjectShape} from "data/project"
import {getLastPathPart} from "data/project_utils"
import {useCallback, useMemo, useRef, useState} from "react"

type ShapeStateMeta = {
	type: "keyboard_move" | "mouse_move" | "initial"
}

type SelectedPoint = {
	pointIndex: number
	shapeId: UUID
}

export type ModelDisplayContextValue = ReturnType<typeof useModelDisplayContext>

type Props = {
	model: ProjectModel
	setModel: SetState<ProjectModel>
	projectConfig: ProjectConfig
}

export const [ModelDisplayContextProvider, useModelDisplayContext] = defineContext({
	name: "ModelDisplayContext",
	useValue: ({model, setModel, projectConfig}: Props) => {
		const inworldUnitPixelSize = projectConfig.inworldUnitPixelSize

		const path = modelProvider.usePathById(model.id)

		const [currentlyDrawnShapeId, setCurrentlyDrawnShapeId] = useState<UUID | null>(null)
		const [selectedShapeId, setSelectedShapeId] = useState<UUID | null>(null)
		const selectedPointRef = useRef<SelectedPoint | null>(null)

		// eslint-disable-next-line react-hooks/exhaustive-deps
		const shapesStateStack = useMemo(() => new StateStack<ProjectShape[], ShapeStateMeta>(100, model.shapes), [model.id])

		const roundToGrain = useCallback((point: XY) => roundPointToGrain(point, inworldUnitPixelSize), [inworldUnitPixelSize])

		const shapesRef = useRef(model.shapes)
		shapesRef.current = model.shapes
		const updateShapes = useCallback((updater: (shapes: ProjectShape[]) => ProjectShape[]) => {
			shapesRef.current = updater(shapesRef.current)
			setModel(model => ({
				...model,
				shapes: shapesRef.current
			}))
		}, [setModel])

		const getShapes = useCallback(() => shapesRef.current, [shapesRef])
		const workbenchRef = useRef<WorkbenchContextValue | null>(null)
		const resetPosition = useCallback(() => {
			workbenchRef?.current?.resetPosition()
		}, [workbenchRef])

		const mouseEventToInworldCoords = useCallback((e: AnyPointerEvent): XY => {
			const workbench = workbenchRef.current
			if(!workbench){
				throw new Error("No workbench is set: cannot convert coords")
			}
			let {x, y} = workbench.pointerEventToWorkbenchCoords(e)
			x /= inworldUnitPixelSize
			y /= inworldUnitPixelSize
			return roundToGrain({x, y})
		}, [inworldUnitPixelSize, roundToGrain, workbenchRef])

		return {
			currentlyDrawnShapeId,
			setCurrentlyDrawnShapeId,
			selectedShapeId,
			setSelectedShapeId,
			model,
			setModel,
			shapesStateStack,
			roundToGrain,
			updateShapes,
			getShapes,
			workbenchRef,
			resetPosition,
			mouseEventToInworldCoords,
			selectedPointRef,
			modelName: !path ? "" : getLastPathPart(path),
			inworldUnitPixelSize
		}
	}
})

const roundNumberToGrain = (x: number, grain: number): number => Math.round(x * grain) / grain
const roundPointToGrain = (point: XY, grain: number) => ({
	x: roundNumberToGrain(point.x, grain),
	y: roundNumberToGrain(point.y, grain)
})
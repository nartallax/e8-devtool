import {XY} from "@nartallax/e8"
import {UnsavedChanges} from "client/components/unsaved_changes_context/unsaved_changes_context"
import {useRevision} from "client/components/unsaved_changes_context/use_revision"
import {WorkbenchContextValue} from "client/components/workbench/workbench_context"
import {useConfig} from "client/parts/config_context"
import {useProject} from "client/parts/project_context"
import {defineContext} from "client/ui_utils/define_context"
import {StateStack} from "client/ui_utils/state_stack"
import {AnyPointerEvent} from "client/ui_utils/use_mouse_drag"
import {UUID} from "common/uuid"
import {ProjectShape} from "data/project"
import {useCallback, useMemo, useRef, useState} from "react"

type ShapeStateMeta = {
	type: "keyboard_move" | "mouse_move" | "initial"
}

type SelectedPoint = {
	pointIndex: number
	shapeId: UUID
}

export type ModelDisplayContextValue = ReturnType<typeof useModelDisplayContext>

export const [ModelDisplayContextProvider, useModelDisplayContext] = defineContext({
	name: "ModelDisplayContext",
	NestedWrapComponent: ({context: {revision, saveModelToProject}, children}) => (
		<UnsavedChanges revision={revision} save={saveModelToProject}>
			{children}
		</UnsavedChanges>
	),
	useValue: ({modelId}: {modelId: UUID}) => {
		const [project, setProject] = useProject()
		const _model = project.models.find(model => model.id === modelId)
		if(!_model){
			throw new Error("No model for ID = " + modelId)
		}
		const [model, setModel] = useState(_model)
		const revision = useRevision(model)

		const {inworldUnitPixelSize} = useConfig()
		const [currentlyDrawnShapeId, setCurrentlyDrawnShapeId] = useState<UUID | null>(null)
		const [selectedShapeId, setSelectedShapeId] = useState<UUID | null>(null)
		const selectedPointRef = useRef<SelectedPoint | null>(null)

		const saveModelToProject = useCallback(() => {
			setProject(project => {
				const models = project.models.filter(model => model.id !== modelId)
				models.push(model)
				return {...project, models}
			})
		}, [setProject, modelId, model])

		// eslint-disable-next-line react-hooks/exhaustive-deps
		const shapesStateStack = useMemo(() => new StateStack<ProjectShape[], ShapeStateMeta>(100, model.shapes), [modelId])

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

		const getShapes = useCallback(() => shapesRef.current!, [shapesRef])
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
			modelId,
			setModel,
			shapesStateStack,
			roundToGrain,
			updateShapes,
			getShapes,
			workbenchRef,
			resetPosition,
			mouseEventToInworldCoords,
			selectedPointRef,
			saveModelToProject,
			revision
		}
	}
})

const roundNumberToGrain = (x: number, grain: number): number => Math.round(x * grain) / grain
const roundPointToGrain = (point: XY, grain: number) => ({
	x: roundNumberToGrain(point.x, grain),
	y: roundNumberToGrain(point.y, grain)
})
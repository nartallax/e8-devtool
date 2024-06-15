import {XY} from "@nartallax/e8"
import {WorkbenchContextValue} from "client/components/workbench/workbench_context"
import {useConfig} from "client/parts/config_context"
import {useProject} from "client/parts/project_context"
import {defineContext} from "client/ui_utils/define_context"
import {StateStack} from "client/ui_utils/state_stack"
import {useLocalStorageState} from "client/ui_utils/use_local_storage_state"
import {UUID} from "common/uuid"
import {ProjectModel, ProjectShape} from "data/project"
import {useCallback, useMemo, useRef, useState} from "react"

type ShapeStateMeta = {
	type: "keyboard_move" | "mouse_move" | "initial"
}

export const [ModelDisplayContextProvider, useModelDisplayContext] = defineContext({
	name: "ModelDisplayContext",
	useValue: ({modelId}: {modelId: UUID}) => {

		const [project, setProject] = useProject()
		const model = project.models.find(model => model.id === modelId)
		if(!model){
			throw new Error("No model for ID = " + modelId)
		}

		const {inworldUnitPixelSize} = useConfig()
		const [isShowingDecomp, setShowDecomp] = useLocalStorageState("modelDisplay.isShowingDecomp", false)
		const [isShowingShapes, setShowShapes] = useLocalStorageState("modelDisplay.isShowingShapes", false)
		const [isShowingGrid, setShowGrid] = useLocalStorageState("modelDisplay.isShowingGrid", true)
		const [currentlyDrawnShapeId, setCurrentlyDrawnShapeId] = useState<UUID | null>(null)
		const [selectedShapeId, setSelectedShapeId] = useState<UUID | null>(null)

		// tbh I don't exactly remember what it is and why can't we just use inworldUnitPixelSize
		// TODO: investigate
		const sizeMultiplier = Math.max(1000, inworldUnitPixelSize * 10)

		const setModel = useCallback((modelOrCallback: ProjectModel | ((oldValue: ProjectModel) => ProjectModel)) => {
			setProject(project => {
				let model: ProjectModel
				if(typeof(modelOrCallback) !== "function"){
					model = modelOrCallback
				} else {
				// TODO: think about reorganizing this array to map-object
				// and other arrays, why not
				// maybe then abolish NamedId alltogeter
					const oldModel = project.models.find(oldModel => oldModel.id === modelId)
					if(!oldModel){
						throw new Error("No old model for editing")
					}
					model = modelOrCallback(oldModel)
				}
				const models = project.models.filter(model => model.id !== modelId)
				models.push(model)
				return {...project, models}
			})
		}, [setProject, modelId])

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

		const mouseEventToInworldCoords = useCallback((e: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent): XY => {
			const workbench = workbenchRef.current
			if(!workbench){
				throw new Error("No workbench is set: cannot convert coords")
			}
			let {x, y} = workbench.pointerEventToWorkbenchCoords(e)
			x /= sizeMultiplier
			y /= sizeMultiplier
			return roundToGrain({x, y})
		}, [sizeMultiplier, roundToGrain, workbenchRef])

		return {
			isShowingDecomp,
			setShowDecomp,
			isShowingGrid,
			setShowGrid,
			isShowingShapes,
			setShowShapes,
			currentlyDrawnShapeId,
			setCurrentlyDrawnShapeId,
			selectedShapeId,
			setSelectedShapeId,
			model,
			modelId,
			setModel,
			sizeMultiplier,
			shapesStateStack,
			roundToGrain,
			updateShapes,
			getShapes,
			workbenchRef,
			resetPosition,
			mouseEventToInworldCoords
		}
	}
})

const roundNumberToGrain = (x: number, grain: number): number => Math.round(x * grain) / grain
const roundPointToGrain = (point: XY, grain: number) => ({
	x: roundNumberToGrain(point.x, grain),
	y: roundNumberToGrain(point.y, grain)
})
import {XY} from "@nartallax/e8"
import {WorkbenchContextValue, useWorkbenchContext} from "client/components/workbench/workbench_context"
import {useConfig} from "client/parts/config_context"
import {useProject} from "client/parts/project_context"
import {SetState} from "client/ui_utils/react_types"
import {StateStack} from "client/ui_utils/state_stack"
import {UUID, zeroUUID} from "common/uuid"
import {ProjectModel, ProjectShape} from "data/project"
import {MutableRefObject, PropsWithChildren, createContext, useCallback, useContext, useMemo, useRef, useState} from "react"

type ShapeStateMeta = {
	type: "keyboard_move" | "mouse_move" | "initial"
}

const defaultModelDisplayContext = {
	modelId: zeroUUID,
	model: null as any as ProjectModel,
	currentlyDrawnShapeId: null as UUID | null,
	setCurrentlyDrawnShapeId: ((id: UUID | null) => {
		void id
	}) as SetState<UUID | null>,
	selectedShapeId: null as UUID | null,
	setSelectedShapeId: ((id: UUID | null) => {
		void id
	}) as SetState<UUID | null>,
	setModel: ((model: ProjectModel) => {
		void model
	}) as SetState<ProjectModel>,
	isShowingGrid: false,
	setShowGrid: (value: boolean) => {
		void value
	},
	isShowingShapes: false,
	setShowShapes: (value: boolean) => {
		void value
	},
	isShowingDecomp: false,
	setShowDecomp: (value: boolean) => {
		void value
	},
	shapesStateStack: new StateStack<ProjectShape[], ShapeStateMeta>(1, [], {type: "initial"}),
	sizeMultiplier: 1,
	roundToGrain: (point: XY) => point,
	updateShapes: (updater: (shapes: ProjectShape[]) => ProjectShape[]) => {
		void updater
	},
	getShapes: (): ProjectShape[] => [],
	workbenchRef: null as unknown as MutableRefObject<WorkbenchContextValue | null>,
	resetPosition: () => {/* nothing! */}
}

type MouseEventToInworldCoordsConverter = (e: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent) => XY

type ModelDisplayContextValue = typeof defaultModelDisplayContext

const ModelDisplayContext = createContext(defaultModelDisplayContext)

type Props = {
	readonly modelId: UUID
}

export const ModelDisplayContextProvider = ({modelId, children}: PropsWithChildren<Props>) => {
	const [project, setProject] = useProject()
	const model = project.models.find(model => model.id === modelId)
	if(!model){
		throw new Error("No model for ID = " + modelId)
	}

	const {inworldUnitPixelSize} = useConfig()
	// TODO: save this in localstorage..?
	const [isShowingDecomp, setShowDecomp] = useState(false)
	const [isShowingShapes, setShowShapes] = useState(false)
	const [isShowingGrid, setShowGrid] = useState(true)
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
	const shapesStateStack = useMemo(() => new StateStack<ProjectShape[]>(100, model.shapes), [modelId])

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

	const value: ModelDisplayContextValue = {
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
		resetPosition
	}

	return <ModelDisplayContext.Provider value={value}>{children}</ModelDisplayContext.Provider>
}

export const useModelDisplayContext = (): ModelDisplayContextValue => {
	return useContext(ModelDisplayContext)
}

// TODO: now when we have workbench ref, we don't need this second hook
export const useModelWorkbenchContext = (): ModelDisplayContextValue & {mouseEventToInworldCoords: MouseEventToInworldCoordsConverter} => {
	const baseContext = useModelDisplayContext()
	const {pointerEventToWorkbenchCoords} = useWorkbenchContext()

	const sizeMultiplier = baseContext.sizeMultiplier
	const roundToGrain = baseContext.roundToGrain
	const mouseEventToInworldCoords = useCallback((e: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent): XY => {
		let {x, y} = pointerEventToWorkbenchCoords(e)
		x /= sizeMultiplier
		y /= sizeMultiplier
		return roundToGrain({x, y})
	}, [sizeMultiplier, roundToGrain, pointerEventToWorkbenchCoords])

	return {...baseContext, mouseEventToInworldCoords}
}


const roundNumberToGrain = (x: number, grain: number): number => Math.round(x * grain) / grain
const roundPointToGrain = (point: XY, grain: number) => ({
	x: roundNumberToGrain(point.x, grain),
	y: roundNumberToGrain(point.y, grain)
})
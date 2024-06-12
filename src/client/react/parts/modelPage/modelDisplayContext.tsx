import {XY} from "@nartallax/e8"
import {useWorkbenchContext} from "client/react/components/workbench/workbenchContext"
import {useConfig} from "client/react/parts/configContext"
import {useProject} from "client/react/parts/projectContext"
import {SetState} from "client/react/uiUtils/setState"
import {StateStack} from "client/react/uiUtils/stateStack"
import {UUID, zeroUUID} from "common/uuid"
import {ProjectModel, ProjectShape} from "data/project"
import {PropsWithChildren, createContext, useCallback, useContext, useMemo, useRef, useState} from "react"

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
	mouseEventToInworldCoords: (e: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent): XY => {
		void e
		return {x: 0, y: 0}
	}
}

type ModelDisplayContextValue = typeof defaultModelDisplayContext

const ModelDisplayContext = createContext(defaultModelDisplayContext)

type Props = {
	readonly model: ProjectModel
	readonly sizeMultiplier: number
}

export const ModelDisplayContextProvider = ({model, sizeMultiplier, children}: PropsWithChildren<Props>) => {
	const [, setProject] = useProject()
	const {inworldUnitPixelSize} = useConfig()
	// TODO: save this in localstorage..?
	const [isShowingDecomp, setShowDecomp] = useState(false)
	const [isShowingShapes, setShowShapes] = useState(false)
	const [isShowingGrid, setShowGrid] = useState(false)
	const [currentlyDrawnShapeId, setCurrentlyDrawnShapeId] = useState<UUID | null>(null)
	const [selectedShapeId, setSelectedShapeId] = useState<UUID | null>(null)
	const {pointerEventToWorkbenchCoords} = useWorkbenchContext()

	const modelId = model.id

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

	const mouseEventToInworldCoords = useCallback((e: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent): XY => {
		let {x, y} = pointerEventToWorkbenchCoords(e)
		x /= sizeMultiplier
		y /= sizeMultiplier
		return roundToGrain({x, y})
	}, [sizeMultiplier, roundToGrain, pointerEventToWorkbenchCoords])

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
		mouseEventToInworldCoords
	}

	return <ModelDisplayContext.Provider value={value}>{children}</ModelDisplayContext.Provider>
}

export const useModelDisplayContext = (): ModelDisplayContextValue => {
	return useContext(ModelDisplayContext)
}


const roundNumberToGrain = (x: number, grain: number): number => Math.round(x * grain) / grain
const roundPointToGrain = (point: XY, grain: number) => ({
	x: roundNumberToGrain(point.x, grain),
	y: roundNumberToGrain(point.y, grain)
})
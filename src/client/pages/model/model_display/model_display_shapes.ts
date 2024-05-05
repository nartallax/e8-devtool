import {ArrayItemWBox, WBox, box, calcBox, unbox} from "@nartallax/cardboard"
import {bindBox, svgTag, tag} from "@nartallax/cardboard-dom"
import {ProjectShape} from "data/project"
import * as css from "./model_display.module.scss"
import {addMouseDragHandler} from "common/mouse_drag"
import {findPointInsertionIndex, shapeToSvgPathD} from "client/pages/model/model_display/model_display_data"
import {attachUiHotkey} from "common/ui_hotkey"
import {ModelDisplayLayersState} from "client/pages/model/model_display/model_display_controls"
import {XY} from "@nartallax/e8"
import {UUID} from "crypto"

export const ModelDisplayShapes = (state: ModelDisplayLayersState) => {
	const selectedShapeId = box<UUID | null>(null)
	const shapeContext = state.shapesStateStack.box.getArrayContext(x => x.id)

	const root = svgTag({
		tag: "svg",
		attrs: {
			width: state.workbench.width,
			height: state.workbench.height,
			viewBox: `${-state.workbench.width / 2} ${-state.workbench.height / 2} ${state.workbench.width} ${state.workbench.height}`
		}
	}, [
		state.shapesStateStack.box.mapArray(shape => shape.id, shapeBox => {
			const shapeId = shapeBox.get().id
			return svgTag({
				tag: "path",
				class: {
					[css.selected!]: selectedShapeId.map(id => id === shapeId)
				},
				onMousedown: e => {
					if(selectedShapeId.get() === shapeId && !isAddDeleteEvent(e)){
						selectedShapeId.set(null)
					} else {
						selectedShapeId.set(shapeId)
					}
				},
				attrs: {
					d: calcBox([shapeBox, state.currentlyDrawnShapeId], (shape, currentlyDrawnShapeId) => {
						return shapeToSvgPathD(shape.points, state.sizeMultiplier, shape.id, currentlyDrawnShapeId)
					}),
					"stroke-width": 0.005 * state.sizeMultiplier
				}
			})
		}),
		state.shapesStateStack.box.mapArray(shape => shape.id, shape => ShapeNodes({
			shape,
			mouseEventToCoords: mouseEventToInworldCoords,
			state,
			selectedShapeId
		}))
	])

	function mouseEventToInworldCoords(e: MouseEvent | TouchEvent): XY {
		let {x, y} = state.workbench.pointerEventToWorkbenchCoords(e)
		x /= state.sizeMultiplier
		y /= state.sizeMultiplier
		return state.roundToGrain({x, y})
	}

	function addNodeAt(e: MouseEvent): void {
		const shapeId = selectedShapeId.get()
		if(shapeId === null){
			return
		}
		const clickCoords = mouseEventToInworldCoords(e)
		const pointsBox = shapeContext.getBoxForKey(shapeId).prop("points")
		const points = pointsBox.get()
		pointsBox.insertElementAtIndex(findPointInsertionIndex(points, clickCoords), [clickCoords.x, clickCoords.y])
		state.shapesStateStack.storeState()
	}

	root.addEventListener("mousedown", e => {
		if(isAddDeleteEvent(e)){
			e.preventDefault()
			e.stopPropagation()
			addNodeAt(e)
			return
		}

		const shapeId = unbox(state.currentlyDrawnShapeId)
		if(shapeId === null){
			return
		}
		const {x, y} = mouseEventToInworldCoords(e)
		const shapeBox = shapeContext.getBoxForKey(shapeId)
		shapeBox.prop("points").appendElement([x, y])
		state.shapesStateStack.storeState()
	})

	root.addEventListener("contextmenu", e => {
		e.preventDefault()
	})

	bindBox(root, state.currentlyDrawnShapeId, id => {
		if(id !== null){
			selectedShapeId.set(id)
		}
	})

	attachUiHotkey(root, e => e.code === "Delete" && selectedShapeId.get() !== null, () => {
		const id = selectedShapeId.get()!
		selectedShapeId.set(null)
		shapeContext.getBoxForKey(id).deleteArrayElement()
		state.shapesStateStack.storeState()
	})

	// undo/redo is handled here because I don't want this hotkeys to act if shape display is hidden
	// I could just check it at higher level control, but that's not as nice
	attachUiHotkey(root, e => {
		const isNormalUndo = e.code === "KeyZ" && e.ctrlKey
		const isMacosUndo = e.code === "KeyZ" && e.metaKey && !e.shiftKey
		return (isNormalUndo || isMacosUndo) && state.shapesStateStack.canUndo()
	}, () => {
		state.shapesStateStack.undo()
	})

	attachUiHotkey(root, e => {
		const isNormalRedo = e.code === "KeyY" && e.ctrlKey
		const isMacosRedo = e.code === "KeyZ" && e.metaKey && e.shiftKey
		return (isNormalRedo || isMacosRedo) && state.shapesStateStack.canRedo()
	}, () => {
		state.shapesStateStack.redo()
	})

	return tag({class: css.shapes}, [root])
}

function isAddDeleteEvent(e: MouseEvent | TouchEvent): boolean {
	return e.ctrlKey || e.metaKey
}



interface ShapeNodesProps {
	readonly shape: ArrayItemWBox<ProjectShape>
	readonly mouseEventToCoords: (evt: MouseEvent | TouchEvent) => XY
	readonly selectedShapeId: WBox<UUID | null>
	readonly state: ModelDisplayLayersState
}

let nodeIdCounter = 0
const ShapeNodes = (props: ShapeNodesProps): SVGElement => {
	const state = props.state
	const points = props.shape.prop("points")
	const shapeId = props.shape.get().id
	let lastMovedPointId: number | null = null
	const pointsWithIds = points.mapArrayElements(
		point => ({id: ++nodeIdCounter, x: point[0], y: point[1]}),
		point => [point.x, point.y] as const
	)
	const pointByIdContext = pointsWithIds.getArrayContext(x => x.id)

	const nodes = pointsWithIds.mapArray(x => x.id, point => {
		const x = point.prop("x")
		const y = point.prop("y")

		const el = svgTag({
			tag: "g",
			attrs: {
				transform: calcBox([x, y], (x, y) => `translate(${x * state.sizeMultiplier}, ${y * state.sizeMultiplier})`)
			}
		}, [
			svgTag({tag: "circle", class: css.mover, attrs: {cx: "0", cy: "0", r: 0.03 * state.sizeMultiplier}}),
			svgTag({tag: "circle", class: css.dot, attrs: {cx: "0", cy: "0", r: 0.0025 * state.sizeMultiplier}})
		])

		let startX = 0, startY = 0
		addMouseDragHandler({
			element: el,
			start: e => {
				if(isAddDeleteEvent(e)){
					e.preventDefault()
					e.stopPropagation()
					if(points.get().length < 4){
						if(props.selectedShapeId.get() === shapeId){
							props.selectedShapeId.set(null)
						}
						props.shape.deleteArrayElement()
					} else {
						point.deleteArrayElement()
					}
					state.shapesStateStack.storeState()
					return false
				}

				if(state.currentlyDrawnShapeId.get() === shapeId){
					state.currentlyDrawnShapeId.set(null)
					state.shapesStateStack.storeState()
					return false
				}

				lastMovedPointId = point.get().id
				startX = x.get()
				startY = y.get()
				return true
			},
			onMove: e => {
				const coords = props.mouseEventToCoords(e)
				x.set(coords.x)
				y.set(coords.y)
			},
			stop: () => {
				if(startX !== x.get() || startY !== y.get()){
					state.shapesStateStack.storeState()
				}
			}
		})

		return {el, box: point}
	})

	const group = svgTag({
		tag: "g",
		class: {
			[css.selected!]: props.selectedShapeId.map(id => id === shapeId)
		},
		onMousedown: () => {
			props.selectedShapeId.set(shapeId)
		}
	}, [
		nodes.mapArrayElements(e => e.el)
	])

	attachUiHotkey(group,
		e => (e.code === "ArrowLeft"
		|| e.code === "ArrowRight"
		|| e.code === "ArrowUp"
		|| e.code === "ArrowDown")
		&& props.selectedShapeId.get() === shapeId
		&& lastMovedPointId !== null,
		e => {

			const b = pointByIdContext.getBoxForKey(lastMovedPointId!)
			const step = 1 / state.sizeMultiplier
			const point = b.get()
			switch(e.code){
				case "ArrowLeft": b.set({...point, x: point.x - step}); return
				case "ArrowRight": b.set({...point, x: point.x + step}); return
				case "ArrowUp": b.set({...point, y: point.y - step}); return
				case "ArrowDown": b.set({...point, y: point.y + step}); return
			}
		})

	return group
}
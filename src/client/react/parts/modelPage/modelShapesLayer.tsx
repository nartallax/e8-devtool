import {useModelWorkbenchContext} from "client/react/parts/modelPage/modelDisplayContext"
import {cn} from "client/react/uiUtils/classname"
import * as css from "./modelDisplay.module.scss"
import {findPointInsertionIndex, shapeToSvgPathD} from "client/pages/model/model_display/model_display_data"
import {useCallback, useEffect, useRef} from "react"
import {addMouseDragHandler} from "common/mouse_drag"
import {UUID, zeroUUID} from "common/uuid"
import {useWorkbenchContext} from "client/react/components/workbench/workbenchContext"
import {useHotkey} from "client/react/components/hotkeyContext/hotkeyContext"
import React = require("react")
import {isRedoKeypress, isUndoKeypress} from "client/react/components/hotkeyContext/hotkeyUtils"

export const ModelShapeLayer = () => {
	const {width: workbenchWidth, height: workbenchHeight} = useWorkbenchContext()
	const {selectedShapeId, shapesStateStack, updateShapes, getShapes, mouseEventToInworldCoords, currentlyDrawnShapeId} = useModelWorkbenchContext()

	const addNodeAt = useCallback((e: MouseEvent | React.MouseEvent) => {
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
	}, [selectedShapeId, shapesStateStack, getShapes, updateShapes, mouseEventToInworldCoords])

	const drawNodeAt = useCallback((e: MouseEvent | React.MouseEvent) => {
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
	}, [currentlyDrawnShapeId, shapesStateStack, getShapes, updateShapes, mouseEventToInworldCoords])

	const onMouseDown = useCallback((e: React.MouseEvent) => {
		if(isAddDeleteEvent(e)){
			e.preventDefault()
			e.stopPropagation()
			addNodeAt(e)
		} else {
			drawNodeAt(e)
		}
	}, [addNodeAt, drawNodeAt])

	return (
		<svg
			onMouseDown={onMouseDown}
			className={css.workbenchLayer}
			width={workbenchWidth + "px"}
			height={workbenchHeight + "px"}
			viewBox={`${-workbenchWidth / 2} ${-workbenchHeight / 2} ${workbenchWidth} ${workbenchHeight}`}>
			<ModelShapePaths/>
			<ModelShapeNodes/>
		</svg>
	)
}

const ModelShapePaths = () => {
	const {model, sizeMultiplier, currentlyDrawnShapeId, selectedShapeId, setSelectedShapeId} = useModelWorkbenchContext()
	return (
		<>{model.shapes.map(shape => (
			<path
				key={shape.id}
				className={cn(css.shapePath, {[css.isSelected!]: selectedShapeId === shape.id})}
				// TODO: ew. can't we do it better somehow? in CSS at least.
				strokeWidth={0.005 * sizeMultiplier}
				d={shapeToSvgPathD(shape.points, sizeMultiplier, shape.id, currentlyDrawnShapeId)}
				onMouseDown={e => setSelectedShapeId(id => id === shape.id && !isAddDeleteEvent(e) ? null : shape.id)}
			/>
		))}</>
	)
}

type MovingPointState = {
	startX: number
	startY: number
	lastX: number
	lastY: number
	pointIndex: number
	shapeId: UUID
}

// TODO: refactor this clusterfuck
const ModelShapeNodes = () => {
	const {model, selectedShapeId, setSelectedShapeId, sizeMultiplier, shapesStateStack, currentlyDrawnShapeId, setCurrentlyDrawnShapeId, getShapes, updateShapes, mouseEventToInworldCoords} = useModelWorkbenchContext()
	const rootRef = useRef<SVGGElement | null>(null)

	useHotkey({
		ref: rootRef,
		shouldPick: useCallback((e: KeyboardEvent) => isUndoKeypress(e) && shapesStateStack.canUndo(), [shapesStateStack]),
		onPress: useCallback(() => {
			updateShapes(() => shapesStateStack.undo())
		}, [shapesStateStack, updateShapes])
	})

	useHotkey({
		ref: rootRef,
		shouldPick: useCallback((e: KeyboardEvent) => isRedoKeypress(e) && shapesStateStack.canRedo(), [shapesStateStack]),
		onPress: useCallback(() => {
			updateShapes(() => shapesStateStack.redo())
		}, [shapesStateStack, updateShapes])
	})

	useHotkey({
		ref: rootRef,
		shouldPick: useCallback((e: KeyboardEvent) => e.key === "Delete" && selectedShapeId !== null, [selectedShapeId]),
		onPress: useCallback(() => {
			updateShapes(shapes => shapes.filter(shape => shape.id !== selectedShapeId))
			shapesStateStack.storeState(getShapes())
			setSelectedShapeId(null)
		}, [shapesStateStack, getShapes, selectedShapeId, setSelectedShapeId, updateShapes])
	})

	const selectedPointState = useRef<MovingPointState>({
		startX: 0,
		startY: 0,
		lastX: 0,
		lastY: 0,
		shapeId: zeroUUID,
		pointIndex: -1
	})

	useHotkey({
		ref: rootRef,
		shouldPick: useCallback((e: KeyboardEvent) => (e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === "ArrowUp") && selectedPointState.current.pointIndex >= 0,
			[selectedPointState]),
		onPress: useCallback(e => {
			const step = 1 / sizeMultiplier
			const shape = getShapes().find(shape => shape.id === selectedPointState.current.shapeId)!
			let [x, y] = shape.points[selectedPointState.current.pointIndex]!
			switch(e.code){
				case "ArrowLeft": x -= step; break
				case "ArrowRight": x += step; break
				case "ArrowUp": y -= step; break
				case "ArrowDown": y += step; break
			}
			selectedPointState.current.lastX = x
			selectedPointState.current.lastY = y
			updateShapes(shapes => shapes.map(shape => shape.id !== selectedPointState.current.shapeId ? shape : {
				...shape,
				points: shape.points.map((point, i) => i !== selectedPointState.current.pointIndex ? point : [x, y])
			}))
			if(shapesStateStack.peekMeta()?.type === "keyboard_move"){
				// compressing multiple keyboard movements into single state
				// this will make undoing easier, and also won't overblow memory consumption
				shapesStateStack.undo()
			}
			shapesStateStack.storeState(getShapes(), {type: "keyboard_move"})
		}, [shapesStateStack, updateShapes, getShapes, sizeMultiplier])
	})

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
				selectedPointState.current.shapeId = targetIds.shapeId
				selectedPointState.current.pointIndex = targetIds.pointIndex
				const shape = getShapes().find(shape => shape.id === selectedPointState.current.shapeId)
				if(!shape){
					throw new Error("No shape for id = " + selectedPointState.current.shapeId)
				}

				if(isAddDeleteEvent(e)){
					e.preventDefault()
					e.stopPropagation()
					if(shape.points.length < 4){
						if(selectedShapeId === selectedPointState.current.shapeId){
							setSelectedShapeId(null)
						}
						updateShapes(shapes => shapes.filter(shape => shape.id !== selectedPointState.current.shapeId))
					} else {
						updateShapes(shapes => shapes.map(shape => shape.id !== selectedPointState.current.shapeId ? shape : {
							...shape,
							points: shape.points.filter((_, i) => i !== selectedPointState.current.pointIndex)
						}))
					}
					shapesStateStack.storeState(getShapes())
					return false
				}

				if(currentlyDrawnShapeId === selectedPointState.current.shapeId){
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

				const [x, y] = shape.points[selectedPointState.current.pointIndex]!
				selectedPointState.current.startX = x
				selectedPointState.current.startY = y
				return true
			},
			onMove: e => {
				const {x, y} = mouseEventToInworldCoords(e)
				selectedPointState.current.lastX = x
				selectedPointState.current.lastY = y
				// TODO: this feels wasteful, to update whole project while moving just one point in one model
				// that's a lot of copying in some cases
				// let's make model editing only actually update project on explicit save?
				// and have a warning on navigation about unsaved changes
				// and asterisk in the title
				updateShapes(shapes => shapes.map(shape => shape.id !== selectedPointState.current.shapeId ? shape : {
					...shape,
					points: shape.points.map((point, i) => i !== selectedPointState.current.pointIndex ? point : [x, y])
				}))
			},
			stop: () => {
				if(
					selectedPointState.current.startX !== selectedPointState.current.lastX
					|| selectedPointState.current.startY !== selectedPointState.current.lastY){
					shapesStateStack.storeState(getShapes(), {type: "mouse_move"})
				}
			}
		})

		return () => dragHandler.detach()
	}, [setSelectedShapeId, setCurrentlyDrawnShapeId, currentlyDrawnShapeId, mouseEventToInworldCoords, shapesStateStack, updateShapes, selectedShapeId, getShapes])

	return (
		<g ref={rootRef}>
			{model.shapes.map(shape => (
				<g
					key={shape.id}
					className={cn(css.shapeNodes, {[css.isSelected!]: selectedShapeId === shape.id})}
					onMouseDown={() => setSelectedShapeId(shape.id)}>
					{shape.points.map(([x, y], i) => (
						<g
							key={i}
							// TODO: size mult is used here for points, but embedded in <path>'s d attr - let's make this consistent
							transform={`translate(${x * sizeMultiplier}, ${y * sizeMultiplier})`}
							data-shape-id={shape.id}
							data-point-index={i}>
							<circle
								className={css.dot}
								cx={0}
								cy={0}
								r={0.0025 * sizeMultiplier}
							/>
							<circle
								className={css.mover}
								cx={0}
								cy={0}
								r={0.03 * sizeMultiplier}
							/>
						</g>
					))}
				</g>
			))}</g>
	)
}

const isAddDeleteEvent = (e: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent): boolean => e.ctrlKey || e.metaKey
const getTargetIds = (e: MouseEvent | TouchEvent): ({shapeId: UUID, pointIndex: number} | null) => {
	let el = e.target
	while(el instanceof SVGElement){
		const shapeId = el.getAttribute("data-shape-id")
		const pointIndex = el.getAttribute("data-point-index")
		if(shapeId && pointIndex){
			return {shapeId: shapeId as UUID, pointIndex: parseInt(pointIndex)}
		}
		el = el.parentElement
	}
	return null
}
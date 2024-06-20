import {MutableRefObject, PropsWithChildren, useCallback, useLayoutEffect, useRef, useState} from "react"
import * as css from "./workbench.module.scss"
import {useElementSize} from "client/ui_utils/use_element_size"
import {WorkbenchContextProvider, WorkbenchContextValue} from "client/components/workbench/workbench_context"
import {AnyPointerEvent, pointerEventsToOffsetCoordsByRect} from "client/ui_utils/use_mouse_drag"
import {useWorkbenchInputProps} from "client/components/workbench/use_workbench_input"

type Props = {
	minZoom?: number
	maxZoom?: number
	initialZoom?: number
	zoomSpeed?: number
	// that's internal space of workbench, not dimensions of external block
	width: number
	height: number
	contextRef?: MutableRefObject<WorkbenchContextValue | null>
}

export type WorkbenchPositionState = {x: number, y: number, zoom: number}

export const Workbench = ({minZoom = 0.25, maxZoom = 10, initialZoom = 1, zoomSpeed = 0.25, width, height, children, contextRef}: PropsWithChildren<Props>) => {
	const [benchState, _setBenchState] = useState({x: (-width / 2) / initialZoom, y: (-height / 2) / initialZoom, zoom: initialZoom})
	const rootRef = useRef<HTMLDivElement | null>(null)
	const {x, y, zoom} = benchState

	// just to avoid re-creating that function each time anything moves
	const benchStateRef = useRef(benchState)
	const updateBenchState = useCallback((updater: (values: WorkbenchPositionState) => WorkbenchPositionState) => {
		const newState = updater(benchStateRef.current)
		benchStateRef.current = newState
		_setBenchState(newState)
		return newState
	}, [])

	const rootSize = useElementSize(rootRef)

	const pointerEventToWorkbenchCoords = useCallback((e: AnyPointerEvent, zoom?: number) => {
		const root = rootRef.current
		if(!root){
			throw new Error("No workbench, cannot convert coords")
		}
		zoom ??= benchStateRef.current.zoom
		const rootSize = root.getBoundingClientRect()
		const coords = pointerEventsToOffsetCoordsByRect(e, rootSize)
		coords.x -= rootSize.width / 2
		coords.y -= rootSize.height / 2
		coords.x -= width / 2
		coords.y -= height / 2
		coords.x /= zoom
		coords.y /= zoom
		coords.x -= benchStateRef.current.x
		coords.y -= benchStateRef.current.y
		return coords
	}, [height, width])

	const resetPosition = useCallback(() => {
		updateBenchState(state => ({
			...state,
			x: (-width / 2) / state.zoom,
			y: (-height / 2) / state.zoom
		}))
	}, [updateBenchState, width, height])

	useLayoutEffect(() => {
		resetPosition()
	}, [resetPosition, width, height])

	const inputProps = useWorkbenchInputProps({setBenchState: updateBenchState, zoomMin: minZoom, zoomMax: maxZoom, zoomSpeed, pointerEventToWorkbenchCoords})

	return (
		<WorkbenchContextProvider
			contextRef={contextRef}
			width={width}
			height={height}
			pointerEventToWorkbenchCoords={pointerEventToWorkbenchCoords}
			resetPosition={resetPosition}>
			<div className={css.workbench} {...inputProps} ref={rootRef}>
				<div
					className={css.workbenchContent}
					style={{
						width: width + "px",
						height: height + "px",
						transform: `translate(${(rootSize.width / 2)}px, ${(rootSize.height / 2)}px) scale(${zoom}) translate(${x}px, ${y}px)`
					}}>{children}</div>
			</div>
		</WorkbenchContextProvider>
	)
}
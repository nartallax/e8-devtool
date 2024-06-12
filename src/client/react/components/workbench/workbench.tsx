import {PropsWithChildren, useCallback, useRef, useState} from "react"
import * as css from "./workbench.module.scss"
import {useWorkbenchInput} from "client/react/components/workbench/useWorkbenchInput"
import {useElementSize} from "client/react/uiUtils/useElementSize"
import {pointerEventsToOffsetCoordsByRect} from "common/mouse_drag"
import {WorkbenchContextProvider} from "client/react/components/workbench/workbenchContext"

type Props = {
	readonly minZoom?: number
	readonly maxZoom?: number
	readonly initialZoom?: number
	readonly zoomSpeed?: number
	// that's internal space of workbench, not dimensions of external block
	readonly width: number
	readonly height: number
}

export type WorkbenchPositionState = {x: number, y: number, zoom: number}

export const Workbench = ({minZoom = 0.25, maxZoom = 10, initialZoom = 1, zoomSpeed = 0.25, width, height, children}: PropsWithChildren<Props>) => {
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

	const pointerEventToWorkbenchCoords = useCallback((e: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent, zoom?: number, x?: number, y?: number) => {
		const root = rootRef.current
		if(!root){
			throw new Error("No workbench, cannot convert coords")
		}
		zoom ??= benchStateRef.current.zoom
		x ??= benchStateRef.current.x
		y ??= benchStateRef.current.y
		const rootSize = root.getBoundingClientRect()
		const coords = pointerEventsToOffsetCoordsByRect(e, rootSize)
		coords.x -= rootSize.width / 2
		coords.y -= rootSize.height / 2
		coords.x -= width / 2
		coords.y -= height / 2
		coords.x /= zoom
		coords.y /= zoom
		coords.x -= x
		coords.y -= y
		return coords
	}, [height, width])

	useWorkbenchInput({rootRef, setBenchState: updateBenchState, zoomMin: minZoom, zoomMax: maxZoom, zoomSpeed, pointerEventToWorkbenchCoords})

	return (
		<WorkbenchContextProvider width={width} height={height} pointerEventToWorkbenchCoords={pointerEventToWorkbenchCoords}>
			<div className={css.workbench} ref={rootRef}>
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
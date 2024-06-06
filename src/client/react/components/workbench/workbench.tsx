import {PropsWithChildren, useRef, useState} from "react"
import * as css from "./workbench.module.scss"
import {useWorkbenchInput} from "client/react/components/workbench/useWorkbenchInput"
import {useElementSize} from "client/react/uiUtils/useElementSize"

type Props = {
	readonly minZoom?: number
	readonly maxZoom?: number
	readonly initialZoom?: number
	readonly zoomSpeed?: number
	// that's internal space of workbench, not dimensions of external block
	readonly width: number
	readonly height: number
}

export const Workbench = ({minZoom = 0.25, maxZoom = 10, initialZoom = 1, zoomSpeed = 0.25, width, height, children}: PropsWithChildren<Props>) => {
	const [{x, y, zoom}, setBenchState] = useState({x: 0, y: 0, zoom: initialZoom})
	const rootRef = useRef<HTMLDivElement | null>(null)

	const rootSize = useElementSize(rootRef)
	useWorkbenchInput({rootRef, rootSize, setBenchState, zoomMin: minZoom, zoomMax: maxZoom, zoomSpeed, contentWidth: width, contentHeight: height})

	return (
		<div className={css.workbench} ref={rootRef}>
			<div
				className={css.workbenchContent}
				style={{
					width: width + "px",
					height: height + "px",
					transform: `translate(${(rootSize.width / 2)}px, ${(rootSize.height / 2)}px) scale(${zoom}) translate(${x - (width / 2)}px, ${y - (height / 2)}px)`
				}}>{children}</div>
		</div>
	)
}
import {PropsWithChildren, forwardRef} from "react"
import * as css from "./model_display.module.scss"
import {useModelDisplayContext} from "client/parts/model_page/model_display/model_display_context"
import {useWorkbenchContext} from "client/components/workbench/workbench_context"

export const ModelDisplaySvgLayer = forwardRef<SVGSVGElement, PropsWithChildren<React.SVGAttributes<SVGSVGElement>>>(({children}, ref) => {
	const {model} = useModelDisplayContext()
	const {width: workbenchWidth, height: workbenchHeight} = useWorkbenchContext()

	return (
		<svg
			ref={ref}
			className={css.workbenchLayer}
			width={workbenchWidth + "px"}
			height={workbenchHeight + "px"}
			viewBox={`${-model.size.x / 2} ${-model.size.y / 2} ${model.size.x} ${model.size.y}`}>
			{children}
		</svg>
	)
})
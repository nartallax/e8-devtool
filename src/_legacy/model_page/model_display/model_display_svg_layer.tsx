import {PropsWithChildren} from "react"
import * as css from "./model_display.module.css"
import {useModelDisplayContext} from "client/parts/model_page/model_display/model_display_context"
import {useWorkbenchContext} from "client/components/workbench/workbench_context"

export const ModelDisplaySvgLayer = ({children, ...props}: PropsWithChildren<React.SVGAttributes<SVGSVGElement>>) => {
	const {model} = useModelDisplayContext()
	const {width: workbenchWidth, height: workbenchHeight} = useWorkbenchContext()

	return (
		<svg
			className={css.workbenchLayer}
			width={workbenchWidth + "px"}
			height={workbenchHeight + "px"}
			viewBox={`${-model.size.x / 2} ${-model.size.y / 2} ${model.size.x} ${model.size.y}`}
			{...props}>
			{children}
		</svg>
	)
}
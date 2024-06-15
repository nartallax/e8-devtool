import {useWorkbenchContext} from "client/components/workbench/workbench_context"
import {useModelDisplayContext} from "client/parts/model_page/model_display/model_display_context"
import {decomposeShapes} from "data/polygon_decomposition"
import {useMemo, useRef} from "react"
import * as css from "./model_display.module.scss"
import {shapeToSvgPathD} from "client/parts/model_page/model_display/model_display_data"
import {getRandomUUID} from "common/uuid"
import {useToastContext} from "client/components/toast/toast_context"
import {Icon} from "generated/icons"

const decompErrorToastId = getRandomUUID()

export const ModelDecompLayer = () => {
	const {model, sizeMultiplier} = useModelDisplayContext()
	const {width: workbenchWidth, height: workbenchHeight} = useWorkbenchContext()
	const {addToast, removeToast} = useToastContext()

	// this is required to avoid update-on-render situation
	const hasToastRef = useRef(false)

	const shapes = model.shapes
	const decomp = useMemo(() => {
		try {
			const result = decomposeShapes(shapes.map(shape => shape.points))
			if(hasToastRef.current){
				removeToast(decompErrorToastId)
				hasToastRef.current = false
			}
			return result
		} catch(e){
			addToast({
				id: decompErrorToastId,
				text: "Failed to decompose.",
				icon: Icon.exclamationTriangle,
				ttl: 5000
			})
			hasToastRef.current = true
			console.error(e)
			return []
		}
	}, [shapes, addToast, removeToast])

	return (
		<svg
			className={css.workbenchLayer}
			width={workbenchWidth + "px"}
			height={workbenchHeight + "px"}
			viewBox={`${-workbenchWidth / 2} ${-workbenchHeight / 2} ${workbenchWidth} ${workbenchHeight}`}>
			{decomp.map((points, index) => (
				<path
					key={index}
					className={css.decompPath}
					// TODO: ew. can't we do it better somehow? in CSS at least.
					strokeWidth={0.005 * sizeMultiplier}
					d={shapeToSvgPathD(points, sizeMultiplier)}
				/>
			))}
		</svg>
	)
}
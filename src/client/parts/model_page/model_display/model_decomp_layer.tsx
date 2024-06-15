import {useWorkbenchContext} from "client/components/workbench/workbench_context"
import {useModelDisplayContext} from "client/parts/model_page/model_display/model_display_context"
import {decomposeShapes} from "data/polygon_decomposition"
import {useMemo} from "react"
import * as css from "./model_display.module.scss"
import {shapeToSvgPathD} from "client/parts/model_page/model_display/model_display_data"

export const ModelDecompLayer = () => {
	const {model, sizeMultiplier} = useModelDisplayContext()
	const {width: workbenchWidth, height: workbenchHeight} = useWorkbenchContext()

	const shapes = model.shapes
	const decomp = useMemo(() => {
		try {
			return decomposeShapes(shapes.map(shape => shape.points))
		} catch(e){
			// TODO: visual indication of shit happening
			console.error(e)
			return []
		}
	}, [shapes])

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
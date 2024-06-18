import {cn} from "client/ui_utils/classname"
import * as css from "../model_display.module.scss"
import {shapeToSvgPathD} from "client/parts/model_page/model_display/model_display_data"
import {useRef} from "react"
import {useModelDisplayContext} from "client/parts/model_page/model_display/model_display_context"
import {ModelDisplaySvgLayer} from "client/parts/model_page/model_display/model_display_svg_layer"
import {useConfig} from "client/parts/config_context"
import {useModelShapesHotkeys} from "client/parts/model_page/model_display/model_shapes_layer/use_model_shapes_hotkeys"
import {useModelShapesDrag} from "client/parts/model_page/model_display/model_shapes_layer/use_model_shapes_drag"
import {isAddDeleteEvent} from "client/parts/model_page/model_display/model_shapes_layer/model_shapes_data"
import {useAddNodeProps} from "client/parts/model_page/model_display/model_shapes_layer/use_add_node_props"

export const ModelShapeLayer = () => {
	const rootRef = useRef<SVGSVGElement | null>(null)
	useModelShapesHotkeys(rootRef)

	return (
		<ModelDisplaySvgLayer {...useAddNodeProps()} ref={rootRef}>
			<ModelShapePaths/>
			<ModelShapeNodes/>
		</ModelDisplaySvgLayer>
	)
}

const ModelShapePaths = () => {
	const {model, currentlyDrawnShapeId, selectedShapeId, setSelectedShapeId} = useModelDisplayContext()
	const {inworldUnitPixelSize} = useConfig()
	return (
		<>
			{model.shapes.map(shape => (
				<path
					key={shape.id}
					className={cn(css.shapePath, {[css.isSelected!]: selectedShapeId === shape.id})}
					strokeWidth={0.005}
					d={shapeToSvgPathD(shape.points, inworldUnitPixelSize, shape.id, currentlyDrawnShapeId)}
					onMouseDown={e => setSelectedShapeId(id => id === shape.id && !isAddDeleteEvent(e) ? null : shape.id)}
				/>
			))}
		</>
	)
}

const ModelShapeNodes = () => {
	const {model, selectedShapeId, setSelectedShapeId} = useModelDisplayContext()
	const rootRef = useRef<SVGGElement | null>(null)
	useModelShapesDrag(rootRef)

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
							data-shape-id={shape.id}
							data-point-index={i}>
							<circle
								className={css.dot}
								cx={x}
								cy={y}
								r={0.0025}
							/>
							<circle
								className={css.mover}
								cx={x}
								cy={y}
								r={0.02}
							/>
						</g>
					))}
				</g>
			))}</g>
	)
}
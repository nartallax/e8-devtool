import {cn} from "client/ui_utils/classname"
import * as css from "../model_display.module.css"
import {shapeToSvgPathD} from "client/parts/model_page/model_display/model_display_data"
import {useModelDisplayContext} from "client/parts/model_page/model_display/model_display_context"
import {ModelDisplaySvgLayer} from "client/parts/model_page/model_display/model_display_svg_layer"
import {isModelShapeNodeAddDeleteEvent} from "client/parts/model_page/model_display/model_shapes_layer/model_shapes_data"
import {useAddNodeProps} from "client/parts/model_page/model_display/model_shapes_layer/use_add_node_props"
import {useModelShapesDragProps} from "client/parts/model_page/model_display/model_shapes_layer/use_model_shapes_drag"
import {ModelShapesHotkeys} from "client/parts/model_page/model_display/model_shapes_layer/model_shapes_hotkeys"

export const ModelShapeLayer = () => {
	return (
		<ModelShapesHotkeys>
			<ModelDisplaySvgLayer {...useAddNodeProps()}>
				<ModelShapePaths/>
				<ModelShapeNodes/>
			</ModelDisplaySvgLayer>
		</ModelShapesHotkeys>
	)
}

const ModelShapePaths = () => {
	const {
		model, currentlyDrawnShapeId, selectedShapeId, setSelectedShapeId
	} = useModelDisplayContext()
	return (
		<>
			{model.shapes.map(shape => (
				<path
					key={shape.id}
					className={cn(css.shapePath, {[css.isSelected!]: selectedShapeId === shape.id})}
					strokeWidth={0.005}
					d={shapeToSvgPathD(shape.points, shape.id, currentlyDrawnShapeId)}
					onMouseDown={e => setSelectedShapeId(id => id === shape.id && !isModelShapeNodeAddDeleteEvent(e) ? null : shape.id)}
				/>
			))}
		</>
	)
}

const ModelShapeNodes = () => {
	const {model, selectedShapeId, setSelectedShapeId} = useModelDisplayContext()
	const dragProps = useModelShapesDragProps()

	return (
		<g {...dragProps}>
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
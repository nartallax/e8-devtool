import {useModelDisplayContext} from "client/parts/model_page/model_display/model_display_context"
import * as css from "./model_display.module.css"
import {ModelDisplaySvgLayer} from "client/parts/model_page/model_display/model_display_svg_layer"

export const ModelGridLayer = () => {
	const {model} = useModelDisplayContext()
	const baseProps = {width: model.size.x, height: model.size.y}

	return (
		<ModelDisplaySvgLayer>
			<Lines
				{...baseProps}
				end={model.size.y}
				isThick
				isHorisontal
			/>
			<Lines
				{...baseProps}
				end={model.size.x}
				isThick
				isHorisontal={false}
			/>
			<Lines
				{...baseProps}
				end={model.size.y}
				step={0.1}
				isHorisontal
			/>
			<Lines
				{...baseProps}
				end={model.size.x}
				step={0.1}
				isHorisontal={false}
			/>
		</ModelDisplaySvgLayer>
	)
}

type BaseProps = {
	isHorisontal: boolean
	isThick?: boolean
	width: number
	height: number
}

type LinesProps = BaseProps & {
	start?: number
	end: number
	step?: number
}

const Lines = ({
	start = 0, end, step = 1, ...props
}: LinesProps): React.ReactNode[] => {
	const lines: React.ReactNode[] = []
	const keyBase = `${props.isHorisontal ? "h" : "v"}-`
	const limit = (end / 2) + 0.001 // that damn machine error on repeated float operations
	for(let value = start; value <= limit; value += step){
		lines.push(<Line key={`${keyBase}-${value}`} offset={value} {...props}/>
		)
		if(value !== 0){
			lines.push(<Line key={`${keyBase}-minus-${value}`} offset={-value} {...props}/>)
		}
	}

	return lines
}

type LineProps = BaseProps & {
	isHorisontal: boolean
	isThick?: boolean
	offset: number
}

const Line = ({
	isHorisontal, isThick, height, width, offset
}: LineProps) => {
	const thickness = isThick ? 0.01 : 0.005
	const centralBump = offset === 0 ? 0.1 : 0
	if(isHorisontal){
		return (
			<rect
				className={css.gridLine}
				width={width + centralBump + thickness}
				height={thickness}
				transform={`translate(0, -${thickness / 2})`}
				x={-(width + centralBump + thickness) / 2}
				y={offset}
			/>
		)
	} else {
		return (
			<rect
				className={css.gridLine}
				height={height + centralBump + thickness}
				width={thickness}
				transform={`translate(-${thickness / 2}, 0)`}
				y={-(height + centralBump + thickness) / 2}
				x={offset}
			/>
		)
	}
}
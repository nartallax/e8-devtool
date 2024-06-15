import {useWorkbenchContext} from "client/components/workbench/workbench_context"
import {useModelDisplayContext} from "client/parts/model_page/model_display/model_display_context"
import * as css from "./model_display.module.scss"

export const ModelGridLayer = () => {
	const {model, sizeMultiplier} = useModelDisplayContext()
	const {width: workbenchWidth, height: workbenchHeight} = useWorkbenchContext()
	const baseProps = {workbenchHeight, workbenchWidth, sizeMultiplier}

	// TODO: refactor this SVG wrapper into separate component? it was copypasted at least twice
	return (
		<svg
			className={css.workbenchLayer}
			width={workbenchWidth + "px"}
			height={workbenchHeight + "px"}
			viewBox={`${-workbenchWidth / 2} ${-workbenchHeight / 2} ${workbenchWidth} ${workbenchHeight}`}>
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
		</svg>
	)
}

type BaseProps = {
	isHorisontal: boolean
	isThick?: boolean
	sizeMultiplier: number
	workbenchWidth: number
	workbenchHeight: number
}

type LinesProps = BaseProps & {
	start?: number
	end: number
	step?: number
}

const Lines = ({start = 0, end, step = 1, ...props}: LinesProps): React.ReactNode[] => {
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

const Line = ({isHorisontal, isThick, sizeMultiplier, workbenchHeight, workbenchWidth, offset}: LineProps) => {
	// TODO: ew.
	const thickness = isThick ? 0.01 * sizeMultiplier : 0.005 * sizeMultiplier
	const centralMultiplier = offset === 0 ? 1.1 : 1
	if(isHorisontal){
		return (
			<rect
				className={css.gridLine}
				width={(workbenchWidth * centralMultiplier) + thickness}
				height={thickness}
				transform={`translate(0, -${thickness / 2})`}
				x={-((workbenchWidth * centralMultiplier) + thickness) / 2}
				y={offset * sizeMultiplier}
			/>
		)
	} else {
		return (
			<rect
				className={css.gridLine}
				height={(workbenchHeight * centralMultiplier) + thickness}
				width={thickness}
				transform={`translate(-${thickness / 2}, 0)`}
				y={-((workbenchHeight * centralMultiplier) + thickness) / 2}
				x={offset * sizeMultiplier}
			/>
		)
	}
}
import {DefaultableSideSize, DefaultableSize, MinMaxableSize, resolveDefaultableSideSize, resolveDefaultableSize, resolveMinMaxableSize} from "client/ui_utils/sizes"
import * as css from "./row_col.module.scss"
import {CSSProperties, PropsWithChildren} from "react"
import {cn} from "client/ui_utils/classname"

type Props = {
	padding?: DefaultableSideSize
	margin?: DefaultableSideSize
	shrink?: number | boolean
	grow?: number | boolean
	/** Shorthand for align="stretch" */
	stretch?: boolean
	/** Shorthand for alignSelf="stretch" */
	stretchSelf?: boolean
	justify?: "start" | "center" | "space-between" | "end"
	align?: "start" | "center" | "end" | "stretch"
	alignSelf?: "start" | "center" | "end" | "stretch"
	width?: MinMaxableSize
	height?: MinMaxableSize
	gap?: DefaultableSize
	border?: DefaultableSideSize
	position?: "static" | "relative" | "absolute" | "fixed"
	className?: string
}

const defaultBorder = "var(--default-border-width)"

const propsToStyle = (props: Props): CSSProperties => ({
	padding: resolveDefaultableSideSize(props.padding),
	margin: resolveDefaultableSideSize(props.margin),
	flexShrink: resolveGrowValue(props.shrink),
	flexGrow: resolveGrowValue(props.grow),
	justifyContent: resolveFlexAlign(props.justify),
	alignItems: resolveFlexAlign(props.align, props.stretch),
	alignSelf: resolveFlexAlign(props.alignSelf, props.stretchSelf),
	gap: resolveDefaultableSize(props.gap),
	borderWidth: resolveDefaultableSideSize(props.border, defaultBorder),
	position: props.position,
	...resolveMinMaxableSize("width", props.width),
	...resolveMinMaxableSize("height", props.height)
})

const resolveGrowValue = (value?: number | boolean) => value === true ? 1 : value === false ? 0 : value

const resolveFlexAlign = (align?: string, stretch?: boolean): string | undefined => {
	return (align === "start" || align === "end" ? "flex-" + align : align) ?? (stretch === true ? "stretch" : undefined)
}

export const Row = ({children, className, ...props}: PropsWithChildren<Props>) => {
	return <div className={cn(css.row, className)} style={propsToStyle(props)}>{children}</div>
}

export const Col = ({children, className, ...props}: PropsWithChildren<Props>) => {
	return <div className={cn(css.col, className)} style={propsToStyle(props)}>{children}</div>
}

export const RowCol
	= ({children, direction = "row", ...props}: PropsWithChildren<Props & {direction?: "row" | "col"}>) => {
		if(direction === "row"){
			return <Row {...props}>{children}</Row>
		} else {
			return <Col {...props}>{children}</Col>
		}
	}
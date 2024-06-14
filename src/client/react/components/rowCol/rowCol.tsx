import {DefaultableSideSize, DefaultableSize, MinMaxableSize, resolveDefaultableSideSize, resolveDefaultableSize, resolveMinMaxableSize} from "client/react/uiUtils/sizes"
import * as css from "./rowCol.module.scss"
import {CSSProperties, PropsWithChildren, RefObject} from "react"
import {cn} from "client/react/uiUtils/classname"

type Props = {
	readonly padding?: DefaultableSideSize
	readonly margin?: DefaultableSideSize
	readonly shrink?: number | boolean
	readonly grow?: number | boolean
	/** Shorthand for align="stretch" */
	readonly stretch?: boolean
	/** Shorthand for alignSelf="stretch" */
	readonly stretchSelf?: boolean
	readonly justify?: "start" | "center" | "space-between" | "end"
	readonly align?: "start" | "center" | "end" | "stretch"
	readonly alignSelf?: "start" | "center" | "end" | "stretch"
	readonly width?: MinMaxableSize
	readonly height?: MinMaxableSize
	readonly gap?: DefaultableSize
	readonly border?: DefaultableSideSize
	readonly ref?: RefObject<HTMLDivElement>
	readonly position?: "static" | "relative" | "absolute" | "fixed"
	readonly className?: string
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

export const Row = ({children, ref, className, ...props}: PropsWithChildren<Props>) => {
	return <div className={cn(css.row, className)} style={propsToStyle(props)} ref={ref}>{children}</div>
}

export const Col = ({children, ref, className, ...props}: PropsWithChildren<Props>) => {
	return <div className={cn(css.col, className)} style={propsToStyle(props)} ref={ref}>{children}</div>
}

export const RowCol = ({children, direction = "row", ...props}: PropsWithChildren<Props & {readonly direction?: "row" | "col"}>) => {
	if(direction === "row"){
		return <Row {...props}>{children}</Row>
	} else {
		return <Col {...props}>{children}</Col>
	}
}
import {DefaultableSideSize, DefaultableSize, MinMaxableSize, resolveDefaultableSideSize, resolveDefaultableSize, resolveMinMaxableSize} from "client/react/uiUtils/sizes"
import * as css from "./rowCol.module.scss"
import {CSSProperties, PropsWithChildren, RefObject} from "react"

type Props = {
	readonly padding?: DefaultableSideSize
	readonly margin?: DefaultableSideSize
	readonly shrink?: number
	readonly grow?: number
	readonly justify?: "start" | "center" | "space-between" | "end"
	readonly align?: "start" | "center" | "end" | "stretch"
	readonly alignSelf?: "start" | "center" | "end" | "stretch"
	readonly width?: MinMaxableSize
	readonly height?: MinMaxableSize
	readonly gap?: DefaultableSize
	readonly border?: DefaultableSideSize
	readonly ref?: RefObject<HTMLDivElement>
	readonly position?: "static" | "relative" | "absolute" | "fixed"
}

const defaultBorder = "var(--default-border-width)"

const propsToStyle = (props: Props): CSSProperties => ({
	padding: resolveDefaultableSideSize(props.padding),
	margin: resolveDefaultableSideSize(props.margin),
	flexShrink: props.shrink,
	flexGrow: props.grow,
	justifyContent: resolveFlexAlign(props.justify),
	alignItems: resolveFlexAlign(props.align),
	alignSelf: resolveFlexAlign(props.alignSelf),
	gap: resolveDefaultableSize(props.gap),
	borderWidth: resolveDefaultableSideSize(props.border, defaultBorder),
	position: props.position,
	...resolveMinMaxableSize("width", props.width),
	...resolveMinMaxableSize("height", props.height)
})

const resolveFlexAlign = (align?: string): string | undefined => {
	return align === "start" || align === "end" ? "flex-" + align : align
}

export const Row = ({children, ref, ...props}: PropsWithChildren<Props>) => {
	return <div className={css.row} style={propsToStyle(props)} ref={ref}>{children}</div>
}

export const Col = ({children, ref, ...props}: PropsWithChildren<Props>) => {
	return <div className={css.col} style={propsToStyle(props)} ref={ref}>{children}</div>
}

export const RowCol = ({children, direction = "row", ...props}: PropsWithChildren<Props & {readonly direction?: "row" | "col"}>) => {
	if(direction === "row"){
		return <Row {...props}>{children}</Row>
	} else {
		return <Col {...props}>{children}</Col>
	}
}
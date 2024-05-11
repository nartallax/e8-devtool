import {DefaultableSideSize, DefaultableSize, MinMaxableSize, resolveDefaultableSideSize, resolveDefaultableSize, resolveMinMaxableSize} from "client/react/uiUtils/sizes"
import * as css from "./rowCol.module.scss"
import {CSSProperties, PropsWithChildren} from "react"

type Props = {
	readonly padding?: DefaultableSideSize
	readonly shrink?: number
	readonly grow?: number
	readonly justify?: "start" | "center" | "space-between" | "end"
	readonly align?: "start" | "center" | "end" | "stretch"
	readonly width?: MinMaxableSize
	readonly height?: MinMaxableSize
	readonly gap?: DefaultableSize
	readonly border?: DefaultableSideSize
}

const defaultBorder = "var(--default-border-width)"

const propsToStyle = (props: Props): CSSProperties => ({
	padding: resolveDefaultableSideSize(props.padding),
	flexShrink: props.shrink,
	flexGrow: props.grow,
	justifyContent: resolveFlexAlign(props.justify),
	alignItems: resolveFlexAlign(props.align),
	gap: resolveDefaultableSize(props.gap),
	borderWidth: resolveDefaultableSideSize(props.border, defaultBorder),
	...resolveMinMaxableSize("width", props.width),
	...resolveMinMaxableSize("height", props.height)
})

const resolveFlexAlign = (align?: string): string | undefined => {
	return align === "start" || align === "end" ? "flex-" + align : align
}

export const Row = ({children, ...props}: PropsWithChildren<Props>) => {
	return <div className={css.row} style={propsToStyle(props)}>{children}</div>
}

export const Col = ({children, ...props}: PropsWithChildren<Props>) => {
	return <div className={css.col} style={propsToStyle(props)}>{children}</div>
}
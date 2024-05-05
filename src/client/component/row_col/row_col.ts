import {defineControl, tag, StyleValues, ClassName} from "@nartallax/cardboard-dom"
import * as css from "./row_col.module.scss"
import {MRBox, RBox, isRBox, constBoxWrap} from "@nartallax/cardboard"

type MinMaxableSize = string | [min: string | null | undefined, value: string, max: string | null | undefined]

export interface RowOrColProps {
	readonly padding?: MRBox<DefaultableSize>
	readonly shrink?: MRBox<number>
	readonly justify?: MRBox<"start" | "center" | "space-between" | "end">
	readonly align?: MRBox<"start" | "center" | "end" | "stretch">
	readonly width?: MRBox<MinMaxableSize>
	readonly height?: MRBox<MinMaxableSize>
	readonly gap?: MRBox<DefaultableSize>
	readonly grow?: MRBox<number>
	readonly class?: ClassName
	readonly border?: MRBox<DefaultableSize>
}

export interface ContainerProps extends RowOrColProps {
	readonly direction?: MRBox<"row" | "col">
}

function resolveFlexAlign(align: MRBox<string | undefined>): RBox<string | undefined> {
	return constBoxWrap(align)
		.map(x => x === "start" || x === "end" ? "flex-" + x : x)
}

type SizeValue = string | number | boolean
type Sides<T> = "vertical" | "horisontal" | "top" | "bottom" | "left" | "right" | T | readonly [T, T] | readonly [T, T, T, T]
export type DefaultableSize = Sides<SizeValue>

const defaultSpacing = "var(--default-spacing)"
const defaultBorderWidth = "var(--default-border-width)"

function resolveSizeValue(size: unknown, dflt: string): string | undefined {
	if(size === true){
		return dflt
	} else if(typeof(size) === "string"){
		return size
	} else if(typeof(size) === "number"){
		return size === 1
			? dflt
			: size === 0
				? "0"
				: `calc(${size} * ${dflt})`
	}
	return undefined
}

function resolveMinMaxableSize(direction: "width" | "height", size: MRBox<MinMaxableSize> | undefined): StyleValues {
	if(size === undefined){
		return {}
	}
	const sizeTripletBox = constBoxWrap(size)
		.map(size => {
			const [min, value, max] = Array.isArray(size) ? size : [null, size, null]
			return {min, value, max}
		})
	const min = sizeTripletBox.prop("min")
	const value = sizeTripletBox.prop("value")
	const max = sizeTripletBox.prop("max")
	if(direction === "width"){
		return {minWidth: min, width: value, maxWidth: max}
	} else {
		return {minHeight: min, height: value, maxHeight: max}
	}
}

function resolveSize(spacing: DefaultableSize | undefined, dflt: string): string | undefined
function resolveSize(spacing: RBox<DefaultableSize | undefined> | undefined, dflt: string): RBox<string | undefined>
function resolveSize(spacing: MRBox<DefaultableSize | undefined> | undefined, dflt: string): MRBox<string | undefined>
function resolveSize(spacing: MRBox<DefaultableSize | undefined>, dflt: string): MRBox<string | undefined> {
	if(isRBox(spacing)){
		return spacing.map(spacing => resolveSize(spacing, dflt))
	}
	switch(spacing){
		case "vertical": return dflt + " 0"
		case "horisontal": return "0 " + dflt
		case "top": return dflt + " 0 0 0"
		case "bottom": return "0 0 " + dflt + " 0"
		case "left": return "0 0 0 " + dflt
		case "right": return "0 " + dflt + " 0 0"
	}

	if(Array.isArray(spacing)){
		return spacing.map(x => resolveSizeValue(x, dflt)).join(" ")
	}

	return resolveSizeValue(spacing, dflt)
}

export function convertContainerPropsToStyle(props: RowOrColProps): StyleValues {
	const result: StyleValues = {
		padding: resolveSize(props.padding, defaultSpacing),
		flexGrow: props.grow,
		flexShrink: props.shrink,
		justifyContent: resolveFlexAlign(props.justify),
		alignItems: resolveFlexAlign(props.align),
		gap: resolveSize(props.gap, defaultSpacing),
		borderWidth: constBoxWrap(resolveSize(props.border, defaultBorderWidth)),
		...resolveMinMaxableSize("width", props.width),
		...resolveMinMaxableSize("height", props.height)
	}
	return result
}

export const Row = defineControl((props: RowOrColProps, children) => {
	return tag({class: [css.row, props.class], style: convertContainerPropsToStyle(props)}, children)
})

export const Col = defineControl((props: RowOrColProps, children) => {
	return tag({class: [css.col, props.class], style: convertContainerPropsToStyle(props)}, children)
})

export const Container = defineControl((props: ContainerProps, children) => {
	const direction = constBoxWrap(props.direction ?? "col")
	return tag({class: [props.class, {
		[css.col!]: direction.map(x => x === "col"),
		[css.row!]: direction.map(x => x === "row")
	}], style: convertContainerPropsToStyle(props)}, children)
})
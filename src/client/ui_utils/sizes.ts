import {CSSProperties} from "react"

/** Defaultable size is a size that is a multiple of some default. It can be defined in a lot of different ways:
1. x number - means x * default
2. boolean - same as x number - true is 1, false is 0
3. string - css size. default is not used. */
export type DefaultableSize = string | number | boolean

/** Sided defaultable size is a way to specify defaultable size for each of four sides independently.
Useful for values like padding/margin/borders etc.
1. side name - equivalent to `true` on this side and 0 for others
2. defaultable size value - use that value for all sizes
3. tuple of two/tuple of four - as in css, vertical-horisontal or top-right-bottom-left*/
type Sides<T> = "vertical" | "horisontal" | "top" | "bottom" | "left" | "right" | T | [T, T] | [T, T, T, T]

export type DefaultableSideSize = Sides<DefaultableSize>

/** A size and maybe bounds for this size */
export type MinMaxableSize = DefaultableSize | [min: DefaultableSize | null | undefined, value: DefaultableSize, max: DefaultableSize | null | undefined]

export const defaultPadding = "var(--default-padding)"

/** Resolve defaultable size to CSS string */
export function resolveDefaultableSideSize(spacing: DefaultableSideSize | undefined, dflt: string = defaultPadding): string | undefined {
	switch(spacing){
		case "vertical": return dflt + " 0"
		case "horisontal": return "0 " + dflt
		case "top": return dflt + " 0 0 0"
		case "bottom": return "0 0 " + dflt + " 0"
		case "left": return "0 0 0 " + dflt
		case "right": return "0 " + dflt + " 0 0"
	}

	if(Array.isArray(spacing)){
		return spacing.map(x => resolveDefaultableSize(x, dflt)).join(" ")
	}

	return resolveDefaultableSize(spacing, dflt)
}

export function resolveDefaultableSize(size: unknown, dflt: string = defaultPadding): string | undefined {
	if(size === true){
		return dflt
	} else if(size === false){
		return "0"
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


export function resolveMinMaxableSize(direction: "width" | "height", size: MinMaxableSize | undefined, dflt: string = defaultPadding): CSSProperties {
	if(size === undefined){
		return {}
	}
	const [min, value, max] = (Array.isArray(size) ? size : [null, size, null])
		.map(size => resolveDefaultableSideSize(size ?? undefined, dflt))
	if(direction === "width"){
		return {minWidth: min, width: value, maxWidth: max}
	} else {
		return {minHeight: min, height: value, maxHeight: max}
	}
}
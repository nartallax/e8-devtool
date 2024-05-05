import {MRBox, WBox} from "@nartallax/cardboard"
import {bindBox, tag} from "@nartallax/cardboard-dom"
import * as css from "./number_input.module.scss"
import {ContainerProps, convertContainerPropsToStyle} from "client/component/row_col/row_col"

interface Props extends Pick<ContainerProps, "width"> {
	/** Number of digits after the point. Default is 0. */
	readonly precision?: number
	readonly allowNegative?: boolean
	readonly placeholder?: MRBox<string>
	readonly value: WBox<number>
	readonly isDisabled?: MRBox<boolean>
	readonly parse?: (str: string) => number
	readonly format?: (value: number) => string
	readonly allowedCharacters?: readonly string[]
}

function formatToPrecisionWithoutTrailingZeroes(value: number, precision: number): string {
	let result = value.toFixed(precision)
	if(precision > 0){
		result = result.replace(/\.?0+$/, "")
	}
	return result

}

export const NumberInput = (props: Props): HTMLInputElement => {
	const tryUpdate = () => {
		requestAnimationFrame(() => props.value.set(parse(input.value)))
	}

	const precision = props.precision ?? 0
	const format = props.format ?? ((value: number) => formatToPrecisionWithoutTrailingZeroes(value, precision))
	const parse = props.parse ?? ((value: string) => {
		if(!value.trim()){
			return 0
		}
		let raw = parseFloat(value)
		if(!props.allowNegative && raw < 0){
			raw = -raw
		}
		const result = parseFloat(formatToPrecisionWithoutTrailingZeroes(raw, precision))
		return result
	})

	const allowedInputCharacters = new Set([
		...("0123456789.".split("")),
		...(props.allowNegative ? ["-"] : [""]),
		...(props.allowedCharacters ?? [])
	])

	const input = tag({
		tag: "input",
		attrs: {placeholder: props.placeholder},
		class: [css.numberInput, {
			[css.disabled!]: props.isDisabled
		}],
		style: convertContainerPropsToStyle({width: props.width}),
		onKeyup: tryUpdate,
		onChange: tryUpdate,
		onBlur: tryUpdate,
		onFocus: tryUpdate,
		onPaste: tryUpdate
	})

	function preventOrUpdate(e: KeyboardEvent): void {
		if(!allowedInputCharacters.has(e.key)){
			e.preventDefault()
		}
		tryUpdate()
	}

	input.addEventListener("keypress", preventOrUpdate)

	bindBox(input, props.value, value => {
		if(value !== parse(input.value)){
			input.value = format(value)
		}
	})

	return input
}
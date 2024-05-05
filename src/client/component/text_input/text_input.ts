import {MRBox, WBox} from "@nartallax/cardboard"
import * as css from "./text_input.module.scss"
import {bindBox, tag} from "@nartallax/cardboard-dom"

interface Props {
	readonly value: WBox<string>
	readonly isDisabled?: MRBox<boolean>
	readonly placeholder?: MRBox<string>
}

export const TextInput = (props: Props): HTMLInputElement => {
	const tryUpdate = () => {
		requestAnimationFrame(() => props.value.set(input.value))
	}

	const input = tag({
		tag: "input",
		attrs: {placeholder: props.placeholder},
		class: [css.textInput, {
			[css.disabled!]: props.isDisabled
		}],
		onKeydown: tryUpdate,
		onKeyup: tryUpdate,
		onKeypress: tryUpdate,
		onChange: tryUpdate,
		onBlur: tryUpdate,
		onFocus: tryUpdate,
		onPaste: tryUpdate
	})

	bindBox(input, props.value, value => {
		if(input.value !== value){ // may be more optimal. or not.
			input.value = value
		}
	})

	return input
}
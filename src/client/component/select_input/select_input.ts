import {WBox} from "@nartallax/cardboard"
import * as css from "./select_input.module.scss"
import {bindBox, tag} from "@nartallax/cardboard-dom"

interface Props<T extends string>{
	readonly items: readonly {name: string, value: T}[]
	readonly value: WBox<T>
}

export const SelectInput = <T extends string>(props: Props<T>) => {
	const input: HTMLSelectElement = tag({
		tag: "select",
		class: css.selectInput,
		onChange: () => props.value.set(input.value as T)
	}, props.items.map(item => tag({
		tag: "option",
		attrs: {
			value: item.value
		}
	}, [item.name])))

	bindBox(input, props.value, value => input.value = value)

	return input
}
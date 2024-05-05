import {WBox} from "@nartallax/cardboard"
import * as css from "./bool_input.module.scss"
import {tag} from "@nartallax/cardboard-dom"
import {Icon} from "generated/icons"

interface Props {
	readonly value: WBox<boolean>
}

export const BoolInput = (props: Props) => {
	return tag({
		tag: "button",
		class: [css.boolInput, {[Icon.check]: props.value}],
		onClick: () => props.value.set(!props.value.get())
	})
}
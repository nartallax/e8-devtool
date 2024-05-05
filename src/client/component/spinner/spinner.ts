import {ClassName, defineControl, tag} from "@nartallax/cardboard-dom"
import * as css from "./spinner.module.scss"
import {Icon} from "generated/icons"

interface Props {
	readonly class?: ClassName
	readonly size?: "normal" | "big"
}

export const Spinner = defineControl((props: Props) => {
	return tag({class: [props.class, css.spinner, Icon.spinner, {
		[css.big!]: props.size === "big"
	}]})
})
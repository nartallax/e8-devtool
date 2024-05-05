import {MRBox, WBox, box} from "@nartallax/cardboard"
import {HTMLChildArray} from "@nartallax/cardboard-dom"
import {Button} from "client/component/button/button"
import {showModal} from "client/component/modal/modal"
import {Row} from "client/component/row_col/row_col"
import {TextInput} from "client/component/text_input/text_input"

interface Props {
	readonly title: string
	readonly initialValue?: string
	readonly value?: WBox<string>
	readonly placeholder?: MRBox<string>
}

export const askUserForString = async(props: Props, otherElements: HTMLChildArray = []): Promise<string | null> => {
	const value = props.value ?? box(props.initialValue ?? "")

	const input = TextInput({value, placeholder: props.placeholder})

	const modal = showModal({
		title: props.title,
		width: "400px",
		align: "stretch",
		gap: true
	}, [
		input,
		...otherElements,
		Row({justify: "end", padding: "top", gap: true}, [
			Button({
				text: "OK",
				onClick: () => modal.close("accept"),
				hotkey: e => e.code === "Enter"
			}),
			Button({
				text: "Cancel",
				onClick: () => modal.close("cancel")
			})
		])
	])

	requestAnimationFrame(() => {
		input.focus()
		input.setSelectionRange(0, input.value.length, "forward")
	})

	const {reason} = await modal.waitClose()
	if(reason === "cancel"){
		return null
	} else {
		return value.get()
	}
}
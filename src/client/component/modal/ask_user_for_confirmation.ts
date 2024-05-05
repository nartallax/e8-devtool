import {MRBox} from "@nartallax/cardboard"
import {tag} from "@nartallax/cardboard-dom"
import {Button} from "client/component/button/button"
import {showModal} from "client/component/modal/modal"
import {Row} from "client/component/row_col/row_col"

interface Props {
	readonly title: MRBox<string>
	readonly text: MRBox<string>
	readonly yesText?: MRBox<string>
	readonly noText?: MRBox<string>
}

export const askUserForConfirmation = async(props: Props): Promise<boolean> => {
	const modal = showModal({
		title: props.title,
		width: "250px",
		align: "stretch"
	}, [
		tag([props.text]),
		Row({padding: "top", gap: true, justify: "end"}, [
			Button({
				text: props.yesText ?? "OK",
				onClick: () => modal.close("accept"),
				hotkey: e => e.code === "Enter"
			}),
			Button({
				text: props.noText ?? "Cancel",
				onClick: () => modal.close("cancel")
			})
		])
	])

	const closeEvt = await modal.waitClose()

	return closeEvt.reason === "accept"
}
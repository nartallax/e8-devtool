import {MRBox} from "@nartallax/cardboard"
import {showModal} from "client/component/modal/modal"
import {Row} from "client/component/row_col/row_col"

interface Props {
	readonly title: MRBox<string>
	readonly text: MRBox<string>
}

export const showUserAlert = async(props: Props): Promise<void> => {
	await showModal({
		title: props.title
	}, [
		Row({align: "center"}, [props.text])
	]).waitClose()
}
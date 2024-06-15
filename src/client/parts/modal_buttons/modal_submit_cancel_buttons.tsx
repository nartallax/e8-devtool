import {Button} from "client/components/button/button"
import {SubmitButton} from "client/components/button/submit_button"
import {Row} from "client/components/row_col/row_col"
import {Icon} from "generated/icons"

type Props = {
	readonly onCancel: () => void
}

export const ModalSubmitCancelButtons = ({onCancel}: Props) => {
	return (
		<Row gap justify="end">
			<Button
				text="Cancel"
				icon={Icon.close}
				onClick={onCancel}
				hotkey={e => e.key === "Escape"}
			/>
			<SubmitButton text="OK" icon={Icon.check}/>
		</Row>
	)
}
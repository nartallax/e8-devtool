import {Button} from "client/react/components/button/button"
import {SubmitButton} from "client/react/components/button/submitButton"
import {Row} from "client/react/components/rowCol/rowCol"
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
				hotkey={e => e.key === "Escape"}/>
			<SubmitButton text="OK" icon={Icon.check}/>
		</Row>
	)
}
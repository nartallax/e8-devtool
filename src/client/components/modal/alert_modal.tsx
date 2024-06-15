import {Button} from "client/components/button/button"
import {Modal} from "client/components/modal/modal"
import {Col, Row} from "client/components/row_col/row_col"
import * as css from "./modal.module.scss"

type Props = {
	readonly header: string
	readonly body: React.ReactNode
	readonly onClose: () => void
}

export const AlertModal = ({header, body, onClose}: Props) => {
	return (
		<Modal header={header} onClose={onClose} contentWidth={["200px", "100%", "50vw"]}>
			<Col gap align="center" padding>
				<div className={css.alertModalBody}>
					{body}
				</div>
				<Row justify="end" alignSelf="stretch">
					<Button text="OK" onClick={onClose}/>
				</Row>
			</Col>
		</Modal>
	)
}
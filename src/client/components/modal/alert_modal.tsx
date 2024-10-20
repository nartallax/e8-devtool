import {Button} from "client/components/button/button"
import {Modal} from "client/components/modal/modal"
import {Col, Row} from "client/components/row_col/row_col"
import * as css from "./modal.module.css"
import {defineContext} from "client/ui_utils/define_context"
import {useCallback, useState} from "react"
import {Icon} from "generated/icons"
import {ModalHotkeyPriority} from "client/components/hotkey_context/hotkey_context"

type Props = {
	header: string
	body: React.ReactNode
	onClose: () => void
}

export const AlertModal = ({header, body, onClose}: Props) => {
	return (
		<Modal
			header={header}
			onClose={onClose}
			contentWidth={["200px", "100%", "50vw"]}
			hotkeyPriority={ModalHotkeyPriority.alert}>
			<Col gap align="center" padding>
				<div className={css.alertModalBody}>
					{body}
				</div>
				<Row justify="end" alignSelf="stretch">
					<Button
						text="OK"
						onClick={onClose}
						hotkey={e => e.code === "Enter"}
						icon={Icon.check}
					/>
				</Row>
			</Col>
		</Modal>
	)
}

const emptyProps: Props & {isOpen: boolean} = {
	header: "Warning",
	body: null,
	onClose: () => {},
	isOpen: false
}

export const [AlertModalProvider, useAlert] = defineContext({
	name: "AlertModalContext",
	useValue: () => {
		const [props, setProps] = useState(emptyProps)

		const showAlert = useCallback((props: Partial<Omit<Props, "onClose">>) => new Promise<void>(ok => {
			setProps({
				...emptyProps,
				...props,
				isOpen: true,
				onClose: () => {
					setProps(emptyProps)
					ok()
				}
			})
		}), [])

		return {props, showAlert}
	},
	additionalChildren: ({props: {isOpen, ...props}}) => isOpen && <AlertModal {...props}/>
})
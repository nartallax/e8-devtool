import {Modal} from "client/components/modal/modal"
import * as css from "./modal.module.css"
import {Icon} from "generated/icons"
import {Col, Row} from "client/components/row_col/row_col"
import {Button} from "client/components/button/button"
import {defineContext} from "client/ui_utils/define_context"
import {useCallback, useState} from "react"
import {ModalHotkeyPriority} from "client/components/hotkey_context/hotkey_context"

type Option<T> = {
	text: string
	icon?: Icon
	hotkey?: (e: KeyboardEvent) => boolean
	value: T
}

type Props<T> = {
	header: string
	body: React.ReactNode
	options: Option<T>[]
	onClose: (result?: T) => void
}

export function ChoiceModal<T>({
	header, body, options, onClose
}: Props<T>) {
	return (
		<Modal header={header} hotkeyPriority={ModalHotkeyPriority.alert}>
			<Col gap align="center" padding>
				<div className={css.alertModalBody}>
					{body}
				</div>
				<Row
					justify="end"
					alignSelf="stretch"
					gap
					margin="top">
					{options.map(option => (
						<Button
							key={option.text}
							text={option.text}
							icon={option.icon}
							onClick={() => {
								onClose(option.value)
							}}
							hotkey={option.hotkey}
						/>
					))}
				</Row>
			</Col>
		</Modal>
	)
}

const emptyProps: Props<any> & {isOpen: boolean} = {
	header: "Warning",
	body: null,
	onClose: () => {
		// nothing here
	},
	options: [],
	isOpen: false
}

export const [ChoiceModalProvider, useChoiceModal] = defineContext({
	name: "ChoiceModalContext",
	useValue: () => {
		const [props, setProps] = useState(emptyProps)

		const showChoiceModal = useCallback(function<T>(props: Partial<Omit<Props<T>, "onClose">>) {
			return new Promise<T | undefined>(ok => {
				setProps({
					...emptyProps,
					...props,
					isOpen: true,
					onClose: (value?: T) => {
						setProps(emptyProps)
						ok(value)
					}
				})
			})
		}, [])

		const showConfirmationModal = useCallback((props: Partial<Omit<Props<unknown>, "options" | "onClose">>) => {
			return showChoiceModal({
				...props,
				options: [
					{
						text: "Cancel", value: false, hotkey: e => e.code === "Escape", icon: Icon.close
					},
					{
						text: "OK", value: true, hotkey: e => e.code === "Enter", icon: Icon.check
					}
				]
			})
		}, [showChoiceModal])

		return {props, showChoiceModal, showConfirmationModal}
	},
	additionalChildren: ({props: {isOpen, ...props}}) => isOpen && <ChoiceModal {...props}/>
})
import {MRBox} from "@nartallax/cardboard"
import {HTMLChildArray, tag} from "@nartallax/cardboard-dom"
import * as css from "./modal.module.scss"
import {Icon} from "generated/icons"
import {attachUiHotkey} from "common/ui_hotkey"
import {Container, ContainerProps} from "client/component/row_col/row_col"

interface ModalProps extends ContainerProps {
	readonly title?: MRBox<string>
}

type ModalCloseReason = "accept" | "cancel"
interface ModalCloseEvent {
	readonly reason: ModalCloseReason
}

export interface Modal {
	/** Root element of the modal.
	 * Exposed for attaching lifecycle stuff to it */
	readonly root: HTMLElement
	open(): void
	close(reason: ModalCloseReason): void
	waitClose(): Promise<ModalCloseEvent>
}

export function showModal(props: ModalProps, children: HTMLChildArray): Modal {
	let closeWaiters: ((evt: ModalCloseEvent) => void)[] = []

	const root = tag({class: css.modalOverlay}, [
		tag({class: css.modal}, [
			!props.title ? null : tag({
				class: css.modalTitle
			}, [
				tag({class: css.modalTitleText}, [props.title]),
				tag({
					class: [css.closeButton, Icon.close],
					onClick: () => close("cancel")
				})
			]),
			Container({
				padding: true,
				grow: 1,
				...props
			}, children)
		])
	])

	function close(reason: ModalCloseReason): void {
		root.classList.add(css.hidden!)
		setTimeout(() => {
			root.classList.remove(css.hidden!)
			root.remove()
		}, 200)

		const waiters = closeWaiters
		closeWaiters = []
		const evt: ModalCloseEvent = {reason}
		for(const waiter of waiters){
			waiter(evt)
		}
	}

	function open(): void {
		root.classList.add(css.hidden!)
		document.body.appendChild(root)
		requestAnimationFrame(() => root.classList.remove(css.hidden!))
	}

	function waitClose(): Promise<ModalCloseEvent> {
		return new Promise(ok => closeWaiters.push(ok))
	}

	attachUiHotkey(root, e => e.code === "Escape", () => close("cancel"))

	const modal: Modal = {root, open, close, waitClose}
	modal.open()

	return modal
}
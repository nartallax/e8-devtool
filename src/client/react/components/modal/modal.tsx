import {Vanisher} from "client/react/components/vanisher/vanisher"
import {createPortal} from "react-dom"
import * as css from "./modal.module.scss"
import {MinMaxableSize, resolveMinMaxableSize} from "client/react/uiUtils/sizes"
import {Icon} from "generated/icons"
import {PropsWithChildren} from "react"
import {Button} from "client/react/components/button/button"

type Props = {
	header: React.ReactNode
	contentWidth?: MinMaxableSize
	contentHeight?: MinMaxableSize
	onClose?: () => void
}

export const Modal = ({header, onClose, contentWidth, contentHeight, children}: PropsWithChildren<Props>) => {

	const bodyStyle = {
		...resolveMinMaxableSize("width", contentWidth),
		...resolveMinMaxableSize("height", contentHeight)
	}

	return createPortal(
		<Vanisher
			width="100vw"
			height="100vh"
			position="absolute"
			zeroInset>
			<div className={css.modalBackground}>
				<Vanisher property="transform" emptyValue="translateY(-50px) scale(0.75)" fullValue="translateY(0) scale(1)">
					<div className={css.modalWrap}>
						<div className={css.modal}>
							<div className={css.modalHeader}>
								{header}
								{!!onClose && <Button
									icon={Icon.close}
									variant="plain-icon"
									onClick={onClose}
									hotkey={e => e.key === "Escape"}/>}
							</div>
							<div className={css.modalBody} style={bodyStyle}>
								{children}
							</div>
						</div>
					</div>
				</Vanisher>
			</div>
		</Vanisher>,
		document.body
	)
}
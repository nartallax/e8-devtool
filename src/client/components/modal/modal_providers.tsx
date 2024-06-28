import {AlertModalProvider} from "client/components/modal/alert_modal"
import {ChoiceModalProvider} from "client/components/modal/choice_modal"
import {PropsWithChildren} from "react"

export const ModalProviders = ({children}: PropsWithChildren) => {
	return (
		<AlertModalProvider>
			<ChoiceModalProvider>
				{children}
			</ChoiceModalProvider>
		</AlertModalProvider>
	)
}
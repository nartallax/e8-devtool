import {FormContextProvider, FormFieldState} from "client/components/form/form_context"
import {UUID} from "common/uuid"
import {PropsWithChildren, useCallback, useMemo, useState} from "react"

type Props = {
	readonly onSubmit?: () => void | Promise<void>
}

export const Form = ({children, onSubmit}: PropsWithChildren<Props>) => {
	const [formFields, setFormFields] = useState<ReadonlyMap<UUID, FormFieldState>>(new Map())
	const [isShowingErrors, setShowingErrors] = useState(false)
	const hasErrors = useMemo(() => !![...formFields.values()].find(({error}) => !!error), [formFields])

	const registerField = useCallback((id: UUID, label: string, error: string | null) => {
		setFormFields(fields => new Map([...fields, [id, {label, error}]]))
	}, [setFormFields])

	const unregisterField = useCallback((id: UUID) => {
		setFormFields(fields => new Map([...fields].filter(([fieldId]) => fieldId !== id)))
	}, [setFormFields])

	const trySubmit = useCallback(async() => {
		setShowingErrors(true)
		if(hasErrors){
			return
		}
		if(onSubmit){
			await Promise.resolve(onSubmit())
		}
	}, [onSubmit, hasErrors])

	return (
		<FormContextProvider
			fields={formFields}
			registerField={registerField}
			unregisterField={unregisterField}
			hasErrors={hasErrors}
			submit={trySubmit}
			isShowingErrors={isShowingErrors}>
			{children}
		</FormContextProvider>
	)
}
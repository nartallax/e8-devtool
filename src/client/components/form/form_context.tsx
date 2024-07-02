import {defineContext} from "client/ui_utils/define_context"
import {UUID, getRandomUUID} from "common/uuid"
import {useEffect, useRef} from "react"

export type Validator<T> = (value: T) => string | null | undefined | void

export type FormInputProps<T> = {
	label: string
	hint?: React.ReactNode
	validators?: Validator<T>[]
}

export type FormFieldDescription<T> = FormInputProps<T> & {
	value: T
}

export type FormFieldState = {
	label: string
	error: string | null
	hint: React.ReactNode
}

/** This object should contain everything that input needs to adjust its look accordingly */
type FormInputVisualState = {
	hasError: boolean
	id: UUID
}

type FormFieldVisualState = {
	error: string | null
	label: string
	hint: React.ReactNode
	fieldLabelWidth: string | undefined
	fieldInputWidth: string | undefined
}

type FormContextValue = {
	registerField: (id: UUID, label: string, hint: React.ReactNode, error: string | null) => void
	unregisterField: (fieldId: UUID) => void
	fields: ReadonlyMap<UUID, FormFieldState>
	submit: () => Promise<void>
	isShowingErrors: boolean
	hasErrors: boolean
	fieldLabelWidth?: string
	fieldInputWidth?: string
}

export const [FormContextProvider, useFormContext] = defineContext({
	name: "FormContext",
	useValue: (value: FormContextValue) => value
})

export const useRegisterField = function<T>({
	label, value, validators, hint = null
}: FormFieldDescription<T>): FormInputVisualState {
	const {registerField, unregisterField, isShowingErrors} = useFormContext()
	const id = useRef<UUID>(getRandomUUID()).current
	const error = validators?.map(validator => validator(value))?.find(x => !!x) || null

	useEffect(() => {
		registerField(id, label, hint, error)
		return () => unregisterField(id)
	}, [registerField, unregisterField, id, label, hint, error])

	return {
		hasError: isShowingErrors && !!error,
		id
	}
}

export const useFormField = (id: UUID): FormFieldVisualState => {
	const {
		fields, isShowingErrors, fieldLabelWidth, fieldInputWidth
	} = useFormContext()
	const field = fields.get(id)
	return {
		error: !isShowingErrors ? null : (field?.error ?? null),
		label: field?.label ?? "",
		hint: field?.hint ?? null,
		fieldLabelWidth,
		fieldInputWidth
	}
}
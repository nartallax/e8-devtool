import {UUID, getRandomUUID} from "common/uuid"
import {PropsWithChildren, createContext, useContext, useEffect, useRef} from "react"

export type Validator<T> = (value: T) => string | null | undefined | void

export type FormInputProps<T> = {
	label: string
	validators?: Validator<T>[]
}

export type FormFieldDescription<T> = FormInputProps<T> & {
	value: T
}

export type FormFieldState = {
	label: string
	error: string | null
}

/** This object should contain everything that input needs to adjust its look accordingly */
type FormInputVisualState = {
	hasError: boolean
	id: UUID
}

type FormFieldVisualState = {
	error: string | null
	label: string
}

const formContextDefault = {
	registerField: function(id: UUID, label: string, error: string | null) {
		void label, error, id
	},
	unregisterField: (fieldId: UUID) => {
		void fieldId
	},
	fields: new Map() as ReadonlyMap<UUID, FormFieldState>,
	submit: async() => {},
	isShowingErrors: false,
	hasErrors: false
}

type FormContextValue = typeof formContextDefault

const FormContext = createContext(formContextDefault)

export const FormContextProvider = ({children, ...value}: PropsWithChildren<FormContextValue>) => {
	return (
		<FormContext.Provider value={value}>
			{children}
		</FormContext.Provider>
	)
}

export const useFormContext = () => useContext(FormContext)
export const useRegisterField = function<T>({label, value, validators}: FormFieldDescription<T>): FormInputVisualState {
	const {registerField, unregisterField, isShowingErrors} = useFormContext()
	const id = useRef<UUID>(getRandomUUID()).current
	const error = validators?.map(validator => validator(value))?.find(x => !!x) || null

	useEffect(() => {
		registerField(id, label, error)
		return () => unregisterField(id)
	}, [registerField, unregisterField, id, label, error])

	return {
		hasError: isShowingErrors && !!error,
		id
	}
}

export const useFormField = (id: UUID): FormFieldVisualState => {
	const {fields, isShowingErrors} = useFormContext()
	const field = fields.get(id)
	return {
		error: !isShowingErrors ? null : (field?.error ?? null),
		label: field?.label ?? ""
	}
}
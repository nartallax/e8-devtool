import {FormInputProps, useRegisterField} from "client/components/form/form_context"
import {FormField} from "client/components/form/form_field"
import {useEffect, useRef} from "react"
import {TextInputBase} from "client/components/text_input/text_input_base"

type Props = FormInputProps<string> & {
	readonly value: string
	readonly onChange: (value: string) => void
	readonly isDisabled?: boolean
	readonly placeholder?: string
	readonly isAutofocused?: boolean
}

export const TextInput = ({value, onChange, isDisabled, placeholder, isAutofocused, ...props}: Props) => {
	const {id, hasError} = useRegisterField({value, ...props})
	const ref = useRef<HTMLInputElement | null>(null)

	useEffect(() => {
		if(isAutofocused){
			ref.current?.focus()
		}
	}, [isAutofocused])

	return (
		<FormField id={id} onLabelClick={() => ref.current?.focus()}>
			<TextInputBase
				value={value}
				onChange={onChange}
				inputRef={ref}
				placeholder={placeholder}
				isDisabled={isDisabled}
				hasError={hasError}
			/>
		</FormField>
	)
}
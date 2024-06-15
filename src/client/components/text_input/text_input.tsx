import {FormInputProps, useRegisterField} from "client/components/form/form_context"
import {FormField} from "client/components/form/form_field"
import {cn} from "client/ui_utils/classname"
import * as css from "./text_input.module.scss"
import {useEffect, useRef} from "react"

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

	const handleChange = () => {
		const input = ref.current
		if(input){
			onChange(input.value)
		}
	}

	useEffect(() => {
		if(isAutofocused){
			ref.current?.focus()
		}
	}, [isAutofocused])

	return (
		<FormField id={id} onLabelClick={() => ref.current?.focus()}>
			<input
				ref={ref}
				className={cn(css.textInput, {[css.hasError!]: hasError})}
				type="text"
				value={value}
				disabled={isDisabled}
				placeholder={placeholder}
				onPaste={handleChange}
				onBlur={handleChange}
				onKeyDown={handleChange}
				onKeyUp={handleChange}
				onChange={handleChange}
			/>
		</FormField>
	)
}
import {FormInputProps, useRegisterField} from "client/components/form/form_context"
import {FormField} from "client/components/form/form_field"
import {MutableRefObject, createRef, useEffect, useMemo} from "react"
import {TextInput} from "client/components/text_input/text_input"
import {Icon} from "generated/icons"

type Props = FormInputProps<string> & {
	value: string
	onChange: (value: string) => void
	isDisabled?: boolean
	placeholder?: string
	isAutofocused?: boolean
	icon?: Icon
	onKeyDown?: (e: React.KeyboardEvent) => void
	inputRef?: MutableRefObject<HTMLInputElement | null>
}

export const TextInputField = ({value, onChange, isDisabled, placeholder, isAutofocused, icon, onKeyDown, inputRef, ...props}: Props) => {
	const {id, hasError} = useRegisterField({value, ...props})
	const ref = useMemo(() => inputRef ?? createRef<HTMLInputElement | null>(), [inputRef])

	useEffect(() => {
		if(isAutofocused){
			ref.current?.focus()
		}
	}, [isAutofocused, ref])

	const wrappedOnKeyDown = (e: React.KeyboardEvent) => {
		if(onKeyDown){
			onKeyDown(e)
		}
		const input = ref.current
		if(input){
			onChange(input.value)
		}
	}

	return (
		<FormField id={id} onLabelClick={() => ref.current?.focus()}>
			<TextInput
				value={value}
				onChange={onChange}
				onKeyDown={wrappedOnKeyDown}
				inputRef={ref}
				placeholder={placeholder}
				isDisabled={isDisabled}
				hasError={hasError}
				icon={icon}
			/>
		</FormField>
	)
}
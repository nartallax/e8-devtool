import {cn} from "client/ui_utils/classname"
import {MutableRefObject, useRef} from "react"
import * as css from "./text_input.module.scss"

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> & {
	value: string
	onChange: (value: string) => void
	isDisabled?: boolean
	inputRef: MutableRefObject<HTMLInputElement | null>
	hasError?: boolean
}

export const TextInputBase = ({value, onChange, isDisabled, inputRef: ref, hasError, ...props}: Props) => {
	const lastValue = useRef(value)
	const handleChange = () => {
		const input = ref.current
		if(input && input.value !== lastValue.current){
			lastValue.current = input.value
			onChange(input.value)
		}
	}

	return (
		<input
			ref={ref}
			className={cn(css.textInputBase, {[css.hasError!]: hasError})}
			type="text"
			defaultValue={value}
			disabled={isDisabled}
			onPaste={handleChange}
			onBlur={handleChange}
			onKeyDown={handleChange}
			onKeyUp={handleChange}
			onChange={handleChange}
			{...props}
		/>
	)
}
import {FormInputProps, useRegisterField} from "client/components/form/form_context"
import {FormField} from "client/components/form/form_field"
import {useRef} from "react"
import {TextInputBase} from "client/components/text_input/text_input_base"

type Props = FormInputProps<number> & {
	readonly value: number
	readonly onChange: (newValue: number) => void
	readonly step?: number
	readonly min?: number
	readonly max?: number
	readonly isDisabled?: boolean
}

const numberReg = /^-?\d+(?:\.\d+)?$/
const parse = (x: string): number | null => {
	if(!numberReg.test(x)){
		return null
	}

	const result = parseFloat(x)
	if(!Number.isFinite(result)){
		return null
	}
	return result
}

const calcFractionDigitsInStep = (value: number): number => {
	let limit = 1
	let result = 0
	while(value < limit){
		limit /= 10
		result++
	}
	return result
}

const tailZeroesRegexp = /\.?0+$/
const stringify = (x: number, step: number): string => {
	const digitsLimit = calcFractionDigitsInStep(step)
	let result = x.toFixed(digitsLimit)
	if(result.indexOf(".") >= 0){
		result = result.replace(tailZeroesRegexp, "")
	}
	return result
}

export const NumberInput = ({value, onChange, step = 0.0001, min = Number.NEGATIVE_INFINITY, max = Number.POSITIVE_INFINITY, isDisabled = false, ...props}: Props) => {
	const {id, hasError} = useRegisterField({value, ...props})
	const ref = useRef<HTMLInputElement | null>(null)

	const handleChange = () => {
		const input = ref.current
		if(!input){
			return
		}

		let value = parse(input.value)
		if(value === null){
			return
		}

		value = Math.max(min, Math.min(max, value))
		value = Math.round(value / step) * step
		onChange(value)
	}

	const onBlur = () => {
		const input = ref.current
		if(input){
			input.value = stringify(value, step)
		}
	}

	return (
		<FormField id={id} onLabelClick={() => ref.current?.focus()}>
			<TextInputBase
				value={stringify(value, step)}
				onChange={handleChange}
				inputRef={ref}
				isDisabled={isDisabled}
				hasError={hasError}
				onBlur={onBlur}
			/>
		</FormField>
	)
}
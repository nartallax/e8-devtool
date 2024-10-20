import {UUID, getRandomUUID} from "common/uuid"
import {useCallback, useMemo, useRef} from "react"

import * as css from "./select.module.css"
import {FormInputProps, useRegisterField} from "client/components/form/form_context"
import {FormField} from "client/components/form/form_field"
import {cn} from "client/ui_utils/classname"

export type SelectOption<T> = {
	value: T
	label: string
}

type Props<T> = FormInputProps<T | null> & {
	options: SelectOption<T>[]
	value: T | null
	onChange: (value: T) => void
}

export function SelectField<T>({options, value, onChange: setValue, ...props}: Props<T>) {
	const ref = useRef<HTMLSelectElement | null>(null)

	// option values could be anything, possibly non-string and even non-serializable
	// so, to avoid having implications about them, we have those maps to convert them to IDs and back
	// and we use IDs in DOM
	const [optionIdToValue, optionValueToId] = useMemo(() => {
		const pairs: [T | null, UUID][] = options.map(({value}) => [value, getRandomUUID()] as const)
		pairs.push([null, getRandomUUID()])
		return [
			new Map(pairs.map(([a, b]) => [b, a])),
			new Map(pairs)
		]
	}, [options])

	const onChange = useCallback(() => {
		const select = ref.current
		if(!select){
			return
		}
		const valueId = select.value as UUID
		const value = optionIdToValue.get(valueId)!
		setValue(value)
	}, [setValue, ref, optionIdToValue])

	const {id, hasError} = useRegisterField({...props, value})

	return (
		<FormField id={id} onLabelClick={() => ref.current?.focus()}>
			<select
				className={cn(css.select, {[css.hasError!]: hasError})}
				value={optionValueToId.get(value)!}
				onChange={onChange}
				ref={ref}>
				{options.map(option => {
					const id = optionValueToId.get(option.value)!
					return <option key={id} value={id}>{option.label}</option>
				})}
				<option key='null' hidden value={optionValueToId.get(null)!}/>
			</select>
		</FormField>
	)
}

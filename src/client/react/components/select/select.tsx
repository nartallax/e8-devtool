import {UUID, getRandomUUID} from "common/uuid"
import {useCallback, useMemo, useRef} from "react"

import * as css from "./select.module.scss"
import {FormInputProps, useRegisterField} from "client/react/components/form/formContext"
import {FormField} from "client/react/components/form/formField"
import {cn} from "client/react/uiUtils/classname"

export type SelectOption<T> = {
	value: T
	label: string
}

type Props<T> = FormInputProps<T | null> & {
	readonly options: SelectOption<T>[]
	readonly value: T | null
	readonly onChange: (value: T) => void
}

// eslint-disable-next-line react/function-component-definition
export function Select<T>({options, value, onChange: setValue, ...props}: Props<T>) {
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
		<FormField id={id}>
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

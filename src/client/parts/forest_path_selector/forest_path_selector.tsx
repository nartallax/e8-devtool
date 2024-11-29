import {FormInputProps} from "client/components/form/form_context"
import {ValueSelectorField} from "client/components/value_selector/value_selector"
import {getLastPathPart} from "data/project_utils"
import {useCallback, useMemo, useState} from "react"

type Props = NullableProps | NonNullableProps

type NonNullableProps = PropsFor<string> & {
	isNullable?: false
}

type NullableProps = PropsFor<string | null> & {
	isNullable: true
}

type PropsFor<T> = FormInputProps<T> & {
	value: T
	onChange: (value: T) => void
	modal: (onClose: (newValue?: T) => void) => React.ReactNode
	absentValueLabel?: string
}

export const ForestPathSelector = ({
	isNullable, value, onChange, modal, absentValueLabel = "<none>", ...props
}: Props) => {
	const [isOpen, setOpen] = useState(false)
	const onClose = useCallback((newValue?: string | null) => {
		setOpen(false)
		if(newValue !== undefined){
			if(newValue !== null || isNullable){
				onChange(newValue!)
			}
		}
	}, [onChange, isNullable])

	const resolver = useMemo(() => {
		return (path: string | null) => path === null ? absentValueLabel : getLastPathPart(path)
	}, [absentValueLabel])

	return (
		<>
			{!!isOpen && modal(onClose)}
			<ValueSelectorField
				{...props}
				value={value!}
				onRequestValueChange={() => {
					setOpen(true)
				}}
				displayValue={resolver(value)}
				onClear={!isNullable ? undefined : () => {
					onChange(null)
				}}
			/>
		</>
	)
}
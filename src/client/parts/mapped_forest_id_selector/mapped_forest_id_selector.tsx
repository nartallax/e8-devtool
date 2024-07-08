import {FormInputProps} from "client/components/form/form_context"
import {ValueSelectorField} from "client/components/value_selector/value_selector"
import {Tree} from "common/tree"
import {UUID} from "common/uuid"
import {mappedForestToNameMap} from "data/project_utils"
import {useCallback, useMemo, useState} from "react"

type Props = NullableProps | NonNullableProps

type NonNullableProps = PropsFor<UUID> & {
	isNullable?: false
}

type NullableProps = PropsFor<UUID | null> & {
	isNullable: true
}

type PropsFor<T> = FormInputProps<T> & {
	value: T
	onChange: (value: T) => void
	onClear?: () => void
	modal: (onClose: (newValue?: T) => void) => React.ReactNode
	absentValueLabel?: string
	forest: Tree<string, string>[]
	map: Record<string, {id: UUID}>
}

// TODO: cleanup?
export const MappedForestIdSelector = ({
	value, onChange, onClear, modal, absentValueLabel = "<none>", isNullable, forest, map: mapObject, ...props
}: Props) => {
	const [isOpen, setOpen] = useState(false)
	const onClose = useCallback((newValue?: UUID | null) => {
		setOpen(false)
		if(newValue !== undefined){
			if(isNullable || newValue !== null){
				onChange(newValue!)
			}
		}
	}, [onChange, isNullable])

	const resolver = useMemo(() => {
		const map = mappedForestToNameMap(forest, mapObject)
		return (uuid: UUID | null) => uuid === null ? absentValueLabel : map.get(uuid) ?? "<unknown UUID>"
	}, [forest, mapObject, absentValueLabel])

	return (
		<>
			{!!isOpen && modal(onClose)}
			<ValueSelectorField
				{...props}
				value={value!}
				onRequestValueChange={() => setOpen(true)}
				displayValue={resolver(value)}
				onClear={onClear}
			/>
		</>
	)
}
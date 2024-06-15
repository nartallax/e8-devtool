import {FormInputProps} from "client/components/form/form_context"
import {ValueSelectorField} from "client/components/value_selector/value_selector"
import {UUID} from "common/uuid"
import {NamedId} from "data/project"
import {useCallback, useMemo, useState} from "react"

type Props = NullableProps | NonNullableProps

type NonNullableProps = PropsFor<UUID> & {
	isNullable?: false
}

type NullableProps = PropsFor<UUID | null> & {
	isNullable: true
}

type PropsFor<T> = FormInputProps<T> & (GetLabelProps | ValuesProps) & {
	readonly value: T
	readonly onChange: (value: T) => void
	readonly modal: (onClose: (newValue?: T) => void) => React.ReactNode
	readonly absentValueLabel?: string
}

type GetLabelProps = {
	getLabel: (value: UUID) => string
}

type ValuesProps = {
	values: readonly NamedId[]
}

const isGetLabelProps = (props: unknown): props is GetLabelProps => !!props && typeof(props) === "object" && "getLabel" in props
const isValuesProps = (props: unknown): props is ValuesProps => !!props && typeof(props) === "object" && "values" in props

export const NamedIdSelector = ({value, onChange, modal, absentValueLabel = "<none>", isNullable, ...props}: Props) => {
	const [isOpen, setOpen] = useState(false)
	const onClose = useCallback((newValue?: UUID | null) => {
		setOpen(false)
		if(newValue !== undefined){
			if(isNullable || newValue !== null){
				onChange(newValue!)
			}
		}
	}, [onChange, isNullable])

	const values = isValuesProps(props) ? props.values : null
	const getLabel = isGetLabelProps(props) ? props.getLabel : null
	const resolver = useMemo(() => {
		if(getLabel){
			return (uuid: UUID | null) => uuid === null ? absentValueLabel : getLabel(uuid)
		}

		if(values){
			const map = new Map(values.map(namedId => [namedId.id, namedId.name]))
			return (uuid: UUID | null) => uuid === null ? absentValueLabel : map.get(uuid) ?? "<unknown UUID>"
		}

		// should never happen
		return (uuid: UUID | null) => uuid + ""
	}, [values, getLabel, absentValueLabel])

	return (
		<>
			{!!isOpen && modal(onClose)}
			<ValueSelectorField
				{...props}
				value={value!}
				onRequestValueChange={() => setOpen(true)}
				getLabel={resolver}
			/>
		</>
	)
}
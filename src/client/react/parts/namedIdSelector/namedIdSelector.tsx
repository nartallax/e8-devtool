import {FormInputProps} from "client/react/components/form/formContext"
import {ValueSelector} from "client/react/components/valueSelector/valueSelector"
import {UUID} from "common/uuid"
import {NamedId} from "data/project"
import {useCallback, useMemo, useState} from "react"

type Props = FormInputProps<UUID | null> & (GetLabelProps | ValuesProps) & {
	readonly value: UUID | null
	readonly onChange: (value: UUID | null) => void
	readonly modal: (onClose: (newValue?: UUID | null) => void) => React.ReactNode
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

export const NamedIdSelector = ({value, onChange, modal, absentValueLabel = "<none>", ...props}: Props) => {
	const [isOpen, setOpen] = useState(false)
	const onClose = useCallback((newValue?: UUID | null) => {
		setOpen(false)
		if(newValue !== undefined){
			onChange(newValue)
		}
	}, [onChange])

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
			<ValueSelector
				{...props}
				value={value}
				onRequestValueChange={() => setOpen(true)}
				getLabel={resolver}/>
		</>
	)
}
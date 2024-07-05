import {FormInputProps} from "client/components/form/form_context"
import {ValueSelectorField} from "client/components/value_selector/value_selector"
import {Tree} from "common/tree"
import {UUID} from "common/uuid"
import {buildIdToNameMap} from "data/project_utils"
import {useCallback, useMemo, useState} from "react"

type Props = NullableProps | NonNullableProps

type NonNullableProps = PropsFor<UUID> & {
	isNullable?: false
}

type NullableProps = PropsFor<UUID | null> & {
	isNullable: true
}

type PropsFor<T> = FormInputProps<T> & (GetLabelProps | ForestProps) & {
	value: T
	onChange: (value: T) => void
	modal: (onClose: (newValue?: T) => void) => React.ReactNode
	absentValueLabel?: string
}

// TODO: not sure if we will ever use this variant
// after everything is migrated to string trees - investigate
type GetLabelProps = {
	getLabel: (value: UUID) => string
}

type ForestProps = {
	forest: Tree<string, string>[]
	map: Record<string, {id: UUID}>
}

const isGetLabelProps = (props: unknown): props is GetLabelProps => !!props && typeof(props) === "object" && "getLabel" in props
const isForestProps = (props: unknown): props is ForestProps => !!props && typeof(props) === "object" && "forest" in props

export const StringForestIdSelector = ({
	value, onChange, modal, absentValueLabel = "<none>", isNullable, ...props
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

	const forest = isForestProps(props) ? props.forest : null
	const mapObject = isForestProps(props) ? props.map : null
	const getLabel = isGetLabelProps(props) ? props.getLabel : null
	const resolver = useMemo(() => {
		if(getLabel){
			return (uuid: UUID | null) => uuid === null ? absentValueLabel : getLabel(uuid)
		}

		if(forest && mapObject){
			const map = buildIdToNameMap(forest, mapObject)
			return (uuid: UUID | null) => uuid === null ? absentValueLabel : map.get(uuid) ?? "<unknown UUID>"
		}

		// should never happen
		return (uuid: UUID | null) => uuid + ""
	}, [forest, mapObject, getLabel, absentValueLabel])

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
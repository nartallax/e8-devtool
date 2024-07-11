import {FormInputProps} from "client/components/form/form_context"
import {ValueSelectorField} from "client/components/value_selector/value_selector"
import {ForestDataProvider} from "client/parts/data_providers/project_forest_data_provider"
import {UUID} from "common/uuid"
import {getLastPathPart} from "data/project_utils"
import {useCallback, useState} from "react"

type Props<V extends {id: UUID}> = NullableProps<V> | NonNullableProps<V>

type NonNullableProps<V extends {id: UUID}> = PropsFor<V, UUID, string> & {
	isNullable?: false
}

type NullableProps<V extends {id: UUID}> = PropsFor<V, UUID | null, string | null> & {
	isNullable: true
}

type PropsFor<V extends {id: UUID}, T, P> = FormInputProps<T> & {
	provider: ForestDataProvider<V>
	value: T
	onChange: (value: T) => void
	modal: (path: P, onClose: (newPath?: P) => void) => React.ReactNode
	absentValueLabel?: string
	loadingValueLabel?: string
}

export function StringForestIdSelector<V extends {id: UUID}>({
	provider, value, onChange, modal, absentValueLabel = "<none>", loadingValueLabel = "...", isNullable, ...props
}: Props<V>) {
	const {getByPath} = provider.useFetchers()

	const [isOpen, setOpen] = useState(false)
	const onClose = useCallback(async(newPath?: string | null) => {
		setOpen(false)
		if(newPath !== undefined){
			if(isNullable || newPath !== null){
				const id = newPath === null ? null : (await getByPath(newPath)).id
				onChange(id!)
			}
		}
	}, [onChange, getByPath, isNullable])

	const path = provider.usePathById(value)
	const name = value === null ? absentValueLabel : !path ? loadingValueLabel : getLastPathPart(path)

	return (
		<>
			{!!isOpen && (value === null || path !== null) && modal(path!, onClose)}
			<ValueSelectorField
				{...props}
				value={value!}
				displayValue={name}
				onRequestValueChange={() => setOpen(true)}
				onClear={!isNullable ? undefined : () => onChange(null)}
			/>
		</>
	)
}
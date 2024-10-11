import {Forest} from "@nartallax/forest"
import {FormInputProps} from "client/components/form/form_context"
import {ValueSelectorField} from "client/components/value_selector/value_selector"
import {ForestDataProvider} from "client/parts/data_providers/api_forest_data_provider"
import {throwPlaceholder} from "client/ui_utils/noop"
import {UUID} from "common/uuid"
import {getLastPathPart, treePathToString} from "data/project_utils"
import {useCallback, useState} from "react"

type Props<V extends {id: UUID}> = NullableProps<V> | NonNullableProps<V>

type NonNullableProps<V extends {id: UUID}> = PropsFor<V, UUID, string> & {
	isNullable?: false
	createEmpty: () => V | Promise<V>
}

type NullableProps<V extends {id: UUID}> = PropsFor<V, UUID | null, string | null> & {
	isNullable: true
}

type PropsFor<V extends {id: UUID}, T, P> = FormInputProps<T> & {
	provider: ForestDataProvider<V>
	value: T
	onChange: (value: T) => void
	// yes, onClose here should be always nullable
	// for cases like "last item in the collection was deleted" - modal should return null
	modal: (path: P, onClose: (newPath?: string | null) => void) => React.ReactNode
	absentValueLabel?: string
	loadingValueLabel?: string
}

export function StringForestIdSelector<V extends {id: UUID}>({
	provider, value, onChange, modal, absentValueLabel = "<none>", loadingValueLabel = "...", isNullable, ...props
}: Props<V>) {
	const {getByPath, getForest} = provider.useFetchers()
	const createEmpty = !isNullable ? (props as NonNullableProps<V>).createEmpty : throwPlaceholder

	const [isOpen, setOpen] = useState(false)
	const onClose = useCallback(async(newPath?: string | null) => {
		setOpen(false)
		if(newPath === undefined){
			return
		}

		if(newPath !== null){
			const id = (await getByPath(newPath)).id
			onChange(id)
			return
		}

		if(isNullable){
			onChange(null)
			return
		}

		const forest = await getForest()
		const leafPath = new Forest(forest).getFirstLeafPath()
		if(leafPath){
			newPath = treePathToString(forest, leafPath)
			const id = (await getByPath(newPath)).id
			onChange(id)
			return
		}

		const emptyItem = await Promise.resolve(createEmpty())
		onChange(emptyItem.id)
	}, [onChange, getByPath, isNullable, createEmpty, getForest])

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
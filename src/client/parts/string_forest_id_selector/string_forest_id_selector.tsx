import {FormInputProps} from "client/components/form/form_context"
import {ValueSelectorField} from "client/components/value_selector/value_selector"
import {Tree} from "common/tree"
import {UUID} from "common/uuid"
import {getLastPathPart} from "data/project_utils"
import {useCallback, useState} from "react"

type Props = NullableProps | NonNullableProps

type NonNullableProps = PropsFor<UUID, string> & {
	isNullable?: false
}

type NullableProps = PropsFor<UUID | null, string | null> & {
	isNullable: true
}

type PropsFor<T, P> = FormInputProps<T> & {
	useResolver: () => (path: string) => Promise<{id: UUID}>
	usePath: (id: UUID | null) => string | null
	value: T
	onChange: (value: T) => void
	modal: (path: P, onClose: (newPath?: P) => void) => React.ReactNode
	absentValueLabel?: string
	loadingValueLabel?: string
	forest: Tree<string, string>[]
}

export const StringForestIdSelector = ({
	useResolver: useIdResolver, usePath, value, onChange, modal, absentValueLabel = "<none>", loadingValueLabel = "...", isNullable, ...props
}: Props) => {
	const getIdByPath = useIdResolver()

	const [isOpen, setOpen] = useState(false)
	const onClose = useCallback(async(newPath?: string | null) => {
		setOpen(false)
		if(newPath !== undefined){
			if(isNullable || newPath !== null){
				const id = newPath === null ? null : (await getIdByPath(newPath)).id
				onChange(id!)
			}
		}
	}, [onChange, getIdByPath, isNullable])

	const path = usePath(value)
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
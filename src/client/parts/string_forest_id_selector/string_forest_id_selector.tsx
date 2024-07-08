import {FormInputProps} from "client/components/form/form_context"
import {ValueSelectorField} from "client/components/value_selector/value_selector"
import {Tree} from "common/tree"
import {UUID} from "common/uuid"
import {getLastPathPart} from "data/project_utils"
import {useCallback, useState} from "react"

type Props = NullableProps | NonNullableProps

type NonNullableProps = PropsFor<UUID> & {
	isNullable?: false
}

type NullableProps = PropsFor<UUID | null> & {
	isNullable: true
}

type PropsFor<T> = FormInputProps<T> & {
	useIdResolver: () => (path: string) => Promise<UUID>
	usePath: (id: UUID | null) => string | null
	value: T
	onChange: (value: T) => void
	modal: (onClose: (newPath?: string | null) => void) => React.ReactNode
	absentValueLabel?: string
	loadingValueLabel?: string
	forest: Tree<string, string>[]
}

export const StringForestIdSelector = ({
	useIdResolver, usePath, value, onChange, modal, absentValueLabel = "<none>", loadingValueLabel = "...", isNullable, ...props
}: Props) => {
	const getIdByPath = useIdResolver()

	const [isOpen, setOpen] = useState(false)
	const onClose = useCallback(async(newPath?: string | null) => {
		setOpen(false)
		if(newPath !== undefined){
			if(isNullable || newPath !== null){
				const id = newPath === null ? null : await getIdByPath(newPath)
				onChange(id!)
			}
		}
	}, [onChange, getIdByPath, isNullable])

	const path = usePath(value)
	const name = value === null ? absentValueLabel : !path ? loadingValueLabel : getLastPathPart(path)

	return (
		<>
			{!!isOpen && modal(onClose)}
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
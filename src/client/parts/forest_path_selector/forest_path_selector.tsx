import {FormInputProps} from "client/components/form/form_context"
import {ValueSelectorField} from "client/components/value_selector/value_selector"
import {Tree} from "common/tree"
import {forestToNameMap} from "data/project_utils"
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
	forest: Tree<string, string>[]
}

export const ForestPathSelector = ({
	isNullable, value, onChange, modal, absentValueLabel = "<none>", forest, ...props
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
		// it's possible to split path here instead of creating a map
		// but I don't want to introduce "split" operation to paths, although it's reasonable thing to do
		const map = forestToNameMap(forest)
		return (path: string | null) => path === null ? absentValueLabel : map.get(path) ?? "<unknown path>"
	}, [forest, absentValueLabel])

	return (
		<>
			{!!isOpen && modal(onClose)}
			<ValueSelectorField
				{...props}
				value={value!}
				onRequestValueChange={() => setOpen(true)}
				getLabel={resolver}
				onClear={!isNullable ? undefined : () => onChange(null)}
			/>
		</>
	)
}
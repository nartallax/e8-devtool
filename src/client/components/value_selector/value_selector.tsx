import {Button} from "client/components/button/button"
import {FormInputProps, useRegisterField} from "client/components/form/form_context"
import {FormField} from "client/components/form/form_field"
import {Icon} from "generated/icons"
import * as css from "./value_selector.module.scss"
import {useCallback} from "react"

type Props<T> = FormInputProps<T> & {
	value: T
	getLabel: (value: T) => string
	onRequestValueChange: () => void
	isDisabled?: boolean
	onClear?: () => void
}

export function ValueSelectorField<T>({
	value, onRequestValueChange, getLabel, isDisabled, onClear, ...props
}: Props<T>) {
	const {id} = useRegisterField({value, ...props})
	const requestChangeIfNotDisabled = useCallback(() => {
		if(!isDisabled){
			onRequestValueChange()
		}
	}, [isDisabled, onRequestValueChange])

	return (
		<FormField id={id} onLabelClick={requestChangeIfNotDisabled}>
			<div className={css.valueSelector} onClick={requestChangeIfNotDisabled}>
				{getLabel(value)}
				<Button icon={Icon.pencil} onClick={onRequestValueChange} isDisabled={isDisabled}/>
				{onClear && <Button icon={Icon.close} onClick={onClear} isDisabled={isDisabled}/>}
			</div>
		</FormField>
	)
}
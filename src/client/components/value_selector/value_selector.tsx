import {Button} from "client/components/button/button"
import {FormInputProps, useRegisterField} from "client/components/form/form_context"
import {FormField} from "client/components/form/form_field"
import {Icon} from "generated/icons"
import * as css from "./value_selector.module.css"
import {useCallback} from "react"
import {isEventInButton} from "client/ui_utils/dom_queries"

type Props<T> = FormInputProps<T> & {
	value: T
	displayValue: string
	onRequestValueChange: () => void
	isDisabled?: boolean
	onClear?: () => void
}

export function ValueSelectorField<T>({
	value, onRequestValueChange, displayValue, isDisabled, onClear, ...props
}: Props<T>) {
	const {id} = useRegisterField({value, ...props})
	const requestChangeIfNotDisabled = useCallback((e: React.MouseEvent) => {
		if(!isDisabled && !isEventInButton(e)){
			onRequestValueChange()
		}
	}, [isDisabled, onRequestValueChange])

	return (
		<FormField id={id} onLabelClick={requestChangeIfNotDisabled}>
			<div className={css.valueSelector} onClick={requestChangeIfNotDisabled}>
				<div className={css.valueSelectorText}>{displayValue}</div>
				<Button icon={Icon.pencil} onClick={onRequestValueChange} isDisabled={isDisabled}/>
				{onClear && <Button icon={Icon.close} onClick={onClear} isDisabled={isDisabled}/>}
			</div>
		</FormField>
	)
}
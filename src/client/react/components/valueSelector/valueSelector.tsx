import {Button} from "client/react/components/button/button"
import {FormInputProps, useRegisterField} from "client/react/components/form/formContext"
import {FormField} from "client/react/components/form/formField"
import {Icon} from "generated/icons"
import * as css from "./valueSelector.module.scss"
import {useCallback} from "react"

type Props<T> = FormInputProps<T> & {
	readonly value: T
	readonly getLabel: (value: T) => string
	readonly onRequestValueChange: () => void
	readonly isDisabled?: boolean
}

export function ValueSelector<T>({value, onRequestValueChange, getLabel, isDisabled, ...props}: Props<T>) {
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
				<Button
					icon={Icon.pencil}
					onClick={onRequestValueChange}
					isDisabled={isDisabled}/>
			</div>
		</FormField>
	)
}
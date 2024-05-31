import {FormInputProps, useRegisterField} from "client/react/components/form/formContext"
import * as css from "./checkbox.module.scss"
import {Icon} from "generated/icons"
import {FormField} from "client/react/components/form/formField"
import {Button} from "client/react/components/button/button"
import {useCallback} from "react"

type Props = FormInputProps<boolean> & {
	readonly value: boolean
	readonly onChange: (value: boolean) => void
	readonly isDisabled?: boolean
}

export const Checkbox = ({value, onChange, isDisabled, ...props}: Props) => {

	const {id, hasError} = useRegisterField({value, ...props})
	const toggle = useCallback(() => !isDisabled && onChange(!value), [onChange, value, isDisabled])

	return (
		<FormField id={id} onLabelClick={toggle}>
			<div className={css.checkbox}>
				<Button
					variant="large-plain-icon"
					icon={value ? Icon.checkboxChecked : Icon.checkboxUnchecked}
					onClick={toggle}
					isDisabled={isDisabled}
					isError={hasError}/>
				<input
					className={css.checkbox}
					type="checkbox"
					checked={!!value}
					onChange={toggle}/>
			</div>
		</FormField>
	)
}
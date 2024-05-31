import {useFormField} from "client/react/components/form/formContext"
import {UUID} from "crypto"
import {PropsWithChildren} from "react"

import * as css from "./form.module.scss"
import {TooltipIcon} from "client/react/components/overlayItem/tooltipIcon"
import {Icon} from "generated/icons"
import {cn} from "client/react/uiUtils/classname"

type Props = {
	readonly id: UUID
	readonly onLabelClick?: () => void
}

export const FormField = ({id, onLabelClick, children}: PropsWithChildren<Props>) => {
	const {label, error} = useFormField(id)

	return (
		<div className={css.formField}>
			<div
				className={cn(css.formFieldLabel, {
					[css.isClickable!]: !!onLabelClick
				})}
				onClick={onLabelClick}>
				<div className={css.formFieldLabelText}>
					{label}
				</div>
				<TooltipIcon icon={Icon.exclamationTriangle} variant="error" isHidden={!error}>
					{error}
				</TooltipIcon>
			</div>
			{children}
		</div>
	)

}
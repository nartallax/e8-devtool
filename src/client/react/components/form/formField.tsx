import {useFormField} from "client/react/components/form/formContext"
import {UUID} from "crypto"
import {PropsWithChildren} from "react"

import * as css from "./form.module.scss"
import {TooltipIcon} from "client/react/components/overlayItem/tooltipIcon"
import {Icon} from "generated/icons"

type Props = {
	readonly id: UUID
}

export const FormField = ({id, children}: PropsWithChildren<Props>) => {
	const {label, error} = useFormField(id)

	// FIXME: hint here
	return (
		<div className={css.formField}>
			<div className={css.formFieldLabel}>
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
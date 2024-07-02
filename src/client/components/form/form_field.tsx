import {useFormField} from "client/components/form/form_context"
import {UUID} from "crypto"
import {PropsWithChildren} from "react"

import * as css from "./form.module.scss"
import {TooltipIcon} from "client/components/overlay_item/tooltip_icon"
import {Icon} from "generated/icons"
import {cn} from "client/ui_utils/classname"

type Props = {
	id: UUID
	onLabelClick?: () => void
}

export const FormField = ({id, onLabelClick, children}: PropsWithChildren<Props>) => {
	const {
		label, error, fieldLabelWidth, fieldInputWidth, hint
	} = useFormField(id)

	return (
		<div className={css.formField}>
			<div
				className={cn(css.formFieldLabel, {
					[css.isClickable!]: !!onLabelClick
				})}
				style={{
					width: fieldLabelWidth
				}}
				onClick={onLabelClick}>
				<div className={css.formFieldLabelText}>
					{label}
				</div>
				<TooltipIcon
					icon={error ? Icon.exclamationTriangle : Icon.questionCircle}
					variant={error ? "error" : "default"}
					isHidden={!error && !hint}
					iconCorner="top-right"
					tooltipCorner="top-left"
					isPreWrapped>
					{error}
					{!!hint && !!error && "\n\n"}
					{hint}
				</TooltipIcon>
			</div>
			<div className={css.formFieldInput} style={{width: fieldInputWidth}}>
				{children}
			</div>
		</div>
	)

}
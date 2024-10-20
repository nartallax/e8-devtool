import * as css from "./separator.module.css"
import {TooltipIcon} from "client/components/overlay_item/tooltip_icon"
import {Icon} from "generated/icons"
import {PropsWithChildren} from "react"
import {useFormContext} from "client/components/form/form_context"

type Props = {
	hint?: React.ReactNode
}

export const Separator = ({children, hint}: PropsWithChildren<Props>) => {
	const {fieldLabelWidth} = useFormContext()
	const style = {["--field-label-width"]: fieldLabelWidth ?? "100%"} as React.CSSProperties

	return (
		<div className={css.separator}>
			{(!!children || !!hint) && (
				<div className={css.separatorStart} style={style}>
					<hr/>
					{!!children && <div className={css.separatorText}>{children}</div>}
				</div>
			)}
			{!!hint && <div className={css.separatorIcon}>
				<TooltipIcon icon={Icon.questionCircle} isPreWrapped variant="disabled">{hint}</TooltipIcon>
			</div>}
			<hr/>
		</div>
	)
}
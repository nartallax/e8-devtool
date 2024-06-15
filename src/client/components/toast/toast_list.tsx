import {useToastContext} from "client/components/toast/toast_context"
import * as css from "./toast.module.scss"
import {cn} from "client/ui_utils/classname"
import {Vanisher} from "client/components/vanisher/vanisher"

export const ToastDisplay = () => {
	const {activeToasts, removeToast} = useToastContext()
	return (
		<div className={css.toastList}>
			{activeToasts.map(toast => (
				<Vanisher key={toast.id} retainPosition noStretch>
					<div className={css.toast} onClick={() => removeToast(toast.id)}>
						{toast.icon
					&& <div className={cn(css.toastIcon, toast.icon, {
						[css.isStepRotating!]: toast.isStepRotating
					})}
					/>}
						<div>{toast.text}</div>
					</div>
				</Vanisher>
			))}
		</div>
	)
}
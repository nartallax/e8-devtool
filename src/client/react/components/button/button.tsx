import {Icon} from "generated/icons"
import * as css from "./button.module.scss"
import {useCallback, useState} from "react"
import {cn} from "client/react/ui_utils/classname"

type Props = {
	readonly text?: string
	readonly icon?: Icon
	readonly onClick?: () => void
	readonly clickRepeatTimeout?: number
	readonly isDisabled?: boolean
}

export const Button = ({text, icon, onClick, clickRepeatTimeout = 250, isDisabled}: Props) => {
	const [disabledByTimeoutCount, setDisabledByTimeoutCount] = useState(0)
	const isEffectivelyDisabled = disabledByTimeoutCount > 0 || isDisabled

	const wrappedOnClick = useCallback(() => {
		onClick?.()
		if(clickRepeatTimeout > 0){
			setDisabledByTimeoutCount(count => count + 1)
			setTimeout(() => setDisabledByTimeoutCount(count => count - 1), 250)
		}
	}, [onClick, clickRepeatTimeout])

	return (
		<button
			type="button"
			className={css.button}
			disabled={isEffectivelyDisabled}
			onClick={wrappedOnClick}
		>
			{!!text && <div className={css.text}>{text}</div>}
			{!!icon && <div className={cn(css.icon, icon)}/>}
		</button>
	)
}
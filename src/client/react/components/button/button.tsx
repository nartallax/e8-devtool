import {Icon} from "generated/icons"
import * as css from "./button.module.scss"
import {useCallback, useRef, useState} from "react"
import {cn} from "client/react/uiUtils/classname"
import {useHotkey} from "client/react/components/hotkeyContext/hotkeyContext"

type Props = {
	readonly text?: string
	readonly icon?: Icon
	readonly onClick?: () => void
	readonly clickRepeatTimeout?: number
	readonly isDisabled?: boolean
	readonly hotkey?: (e: KeyboardEvent) => boolean
	readonly variant?: "default" | "plain-icon" | "tab"
	readonly isActive?: boolean
}

export const Button = ({text, icon, onClick, clickRepeatTimeout = 250, isDisabled, hotkey, variant = "default", isActive = false}: Props) => {
	const [disabledByTimeoutCount, setDisabledByTimeoutCount] = useState(0)
	const isEffectivelyDisabled = disabledByTimeoutCount > 0 || isDisabled
	const ref = useRef<HTMLButtonElement>(null)

	const wrappedOnClick = useCallback(() => {
		onClick?.()
		if(clickRepeatTimeout > 0){
			setDisabledByTimeoutCount(count => count + 1)
			setTimeout(() => setDisabledByTimeoutCount(count => count - 1), 250)
		}
	}, [onClick, clickRepeatTimeout])

	useHotkey({ref, shouldPick: hotkey, onPress: wrappedOnClick})

	return (
		<button
			ref={ref}
			type="button"
			className={cn(css.button, {
				[css.defaultVariant!]: variant === "default",
				[css.plainIconVariant!]: variant === "plain-icon",
				[css.tabVariant!]: variant === "tab",
				[css.isActive!]: isActive
			})}
			disabled={isEffectivelyDisabled}
			onClick={wrappedOnClick}>
			{!!text && <div className={css.text}>{text}</div>}
			{!!icon && <div className={cn(css.icon, icon)}/>}
		</button>
	)
}
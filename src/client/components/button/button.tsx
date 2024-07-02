import {Icon} from "generated/icons"
import * as css from "./button.module.scss"
import {useCallback, useRef, useState} from "react"
import {cn} from "client/ui_utils/classname"
import {Hotkey} from "client/components/hotkey_context/hotkey_context"

type Props = {
	text?: string
	icon?: Icon
	/** null is possible if handler is invoked by hotkey */
	onClick?: (e: React.MouseEvent | null) => void
	clickRepeatTimeout?: number
	isDisabled?: boolean
	isError?: boolean
	hotkey?: (e: KeyboardEvent) => boolean
	variant?: "default" | "plain-icon" | "large-plain-icon" | "tab"
	type?: "submit" | "reset" | "button"
	isActive?: boolean
	/** If passed, user will be required to hold the button for some time until onClick is called.
	This can be bypassed by holding shift when clicking */
	holdTimeUntilAction?: number
}

export const Button = ({
	text, icon, onClick, clickRepeatTimeout = 250, isDisabled, isError, hotkey, variant = "default", isActive = false, holdTimeUntilAction = 0, type = "button"
}: Props) => {
	const [disabledByTimeoutCount, setDisabledByTimeoutCount] = useState(0)
	const isEffectivelyDisabled = disabledByTimeoutCount > 0 || isDisabled
	const ref = useRef<HTMLButtonElement>(null)
	const [isPressed, setIsPressed] = useState(false)
	const timeout = useRef<ReturnType<typeof setTimeout> | null>(null)

	const doClick = useCallback((e: React.MouseEvent | null) => {
		onClick?.(e)
		if(clickRepeatTimeout > 0){
			setDisabledByTimeoutCount(count => count + 1)
			setTimeout(() => setDisabledByTimeoutCount(count => count - 1), 250)
		}
	}, [onClick, clickRepeatTimeout])

	const wrappedOnClick = useCallback(() => {
		if(holdTimeUntilAction > 0){
			return // will be processed by onDown/onUp handlers
		}
		doClick(null)
	}, [doClick, holdTimeUntilAction])

	const onPress = useCallback((e: React.MouseEvent) => {
		if(e.shiftKey){
			doClick(e)
			return
		}
		if(holdTimeUntilAction === 0){
			return // processed by click handler
		}
		setIsPressed(true)
		timeout.current = setTimeout(() => {
			doClick(e)
			setIsPressed(false)
		}, holdTimeUntilAction)
	}, [doClick, holdTimeUntilAction])

	const onRelease = useCallback(() => {
		setIsPressed(false)
		if(timeout.current !== null){
			clearTimeout(timeout.current)
		}
		timeout.current = null
	}, [])

	return (
		<Hotkey shouldPick={hotkey} onPress={wrappedOnClick}>
			<button
				ref={ref}
				// those eslint rules are really stupid it turns out
				// eslint-disable-next-line react/button-has-type
				type={type}
				className={cn(css.button, {
					[css.defaultVariant!]: variant === "default",
					[css.plainIconVariant!]: variant === "plain-icon",
					[css.largePlainIconVariant!]: variant === "large-plain-icon",
					[css.tabVariant!]: variant === "tab",
					[css.isActive!]: isActive,
					[css.isPressed!]: isPressed,
					[css.isError!]: isError
				})}
				style={{["--holdTimeUntilAction"]: (holdTimeUntilAction / 1000) + "s"} as React.CSSProperties}
				disabled={isEffectivelyDisabled}
				onClick={wrappedOnClick}
				onMouseDown={onPress}
				onMouseUp={onRelease}>
				{!!icon && <div className={cn(css.icon, icon)}/>}
				{!!text && <div>{text}</div>}
			</button>
		</Hotkey>
	)
}
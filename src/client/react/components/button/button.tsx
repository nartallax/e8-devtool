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
	readonly type?: "submit" | "reset" | "button"
	readonly isActive?: boolean
	/** If passed, user will be required to hold the button for some time until onClick is called.
	This can be bypassed by holding shift when clicking */
	readonly holdTimeUntilAction?: number
}

export const Button = ({text, icon, onClick, clickRepeatTimeout = 250, isDisabled, hotkey, variant = "default", isActive = false, holdTimeUntilAction = 0, type = "button"}: Props) => {
	const [disabledByTimeoutCount, setDisabledByTimeoutCount] = useState(0)
	const isEffectivelyDisabled = disabledByTimeoutCount > 0 || isDisabled
	const ref = useRef<HTMLButtonElement>(null)
	const [isPressed, setIsPressed] = useState(false)
	const timeout = useRef<ReturnType<typeof setTimeout> | null>(null)

	const doClick = useCallback(() => {
		onClick?.()
		if(clickRepeatTimeout > 0){
			setDisabledByTimeoutCount(count => count + 1)
			setTimeout(() => setDisabledByTimeoutCount(count => count - 1), 250)
		}
	}, [onClick, clickRepeatTimeout])

	const wrappedOnClick = useCallback(() => {
		if(holdTimeUntilAction > 0){
			return // will be processed by onDown/onUp handlers
		}
		doClick()
	}, [doClick, holdTimeUntilAction])

	const onPress = useCallback((e: React.MouseEvent) => {
		if(e.shiftKey){
			doClick()
			return
		}
		if(holdTimeUntilAction === 0){
			return // processed by click handler
		}
		setIsPressed(true)
		timeout.current = setTimeout(() => {
			doClick()
		}, holdTimeUntilAction)
	}, [doClick, holdTimeUntilAction])

	const onRelease = useCallback(() => {
		setIsPressed(false)
		if(timeout.current !== null){
			clearTimeout(timeout.current)
		}
		timeout.current = null
	}, [])

	useHotkey({ref, shouldPick: hotkey, onPress: wrappedOnClick})

	return (
		<button
			ref={ref}
			// those eslint rules are really stupid it turns out
			// eslint-disable-next-line react/button-has-type
			type={type}
			className={cn(css.button, {
				[css.defaultVariant!]: variant === "default",
				[css.plainIconVariant!]: variant === "plain-icon",
				[css.tabVariant!]: variant === "tab",
				[css.isActive!]: isActive,
				[css.isPressed!]: isPressed
			})}
			style={{["--holdTimeUntilAction"]: (holdTimeUntilAction / 1000) + "s"} as React.CSSProperties}
			disabled={isEffectivelyDisabled}
			onClick={wrappedOnClick}
			onMouseDown={onPress}
			onMouseUp={onRelease}>
			{!!icon && <div className={cn(css.icon, icon)}/>}
			{!!text && <div className={css.text}>{text}</div>}
		</button>
	)
}
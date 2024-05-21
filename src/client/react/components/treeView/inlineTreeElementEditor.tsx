import {useCallback, useEffect, useRef, useState} from "react"
import * as css from "./treeView.module.scss"
import {useHotkey} from "client/react/components/hotkeyContext/hotkeyContext"
import {cn} from "client/react/uiUtils/classname"
import {ValidatorsMaybeFabric, resolveValidatorsMaybeFabric} from "client/react/components/form/validators"

type Props<T> = {
	readonly initialValue: string
	readonly onComplete: (newValue: string | null) => void
	readonly row: T
	readonly validators?: ValidatorsMaybeFabric<string, T>
}

export function InlineTreeElementEditor <T>({initialValue, onComplete, validators, row}: Props<T>) {
	// this state is just to make it rerender-resistant
	const [value, setValue] = useState(initialValue)
	const [isShaking, setShaking] = useState(0)

	const ref = useRef<HTMLInputElement | null>(null)

	const updateValue = useCallback(() => {
		if(!ref.current){
			return
		}
		const value = ref.current.value
		setValue(value)
	}, [setValue])

	useHotkey({
		ref,
		shouldPick: e => e.key === "Enter",
		onPress: () => {
			if(!ref.current){
				return
			}
			const resolvedValidators = resolveValidatorsMaybeFabric(validators, row)
			const value = ref.current.value
			const hasError = !value || !!resolvedValidators?.find(x => !!x(value))
			if(hasError){
				setShaking(x => x + 1)
				setTimeout(() => setShaking(x => x - 1), 300)
			} else {
				onComplete(value)
			}
		}
	})

	useHotkey({
		ref,
		shouldPick: e => e.key === "Escape",
		onPress: () => {
			onComplete(null)
		}
	})

	useEffect(() => {
		const el = ref.current
		if(!el){
			return
		}
		el.focus()
		el.selectionStart = 0
		el.selectionEnd = el.value.length
	}, [])

	return (
		<input
			type="text"
			className={cn(css.inlineEditor, {[css.shake!]: !!isShaking})}
			value={value}
			onChange={updateValue}
			onKeyDown={updateValue}
			onKeyUp={updateValue}
			onPaste={updateValue}
			// onBlur={() => onComplete(null)}
			ref={ref}/>
	)
}
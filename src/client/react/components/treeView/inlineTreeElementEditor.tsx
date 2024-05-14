import {useCallback, useEffect, useRef, useState} from "react"
import * as css from "./treeView.module.scss"
import {useHotkey} from "client/react/components/hotkeyContext/hotkeyContext"

type Props = {
	readonly initialValue: string
	readonly onComplete: (newValue: string | null) => void
}

export const InlineTreeElementEditor = ({initialValue, onComplete}: Props) => {
	// this state is just to make it rerender-resistant
	const [value, setValue] = useState(initialValue)

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
			const value = ref.current.value
			onComplete(value)
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
			className={css.inlineEditor}
			value={value}
			onChange={updateValue}
			onKeyDown={updateValue}
			onKeyUp={updateValue}
			onPaste={updateValue}
			onBlur={() => onComplete(null)}
			ref={ref}/>
	)
}
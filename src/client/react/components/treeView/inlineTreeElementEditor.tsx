import {useCallback, useEffect, useRef, useState} from "react"
import * as css from "./treeView.module.scss"
import {cn} from "client/react/uiUtils/classname"
import {ValidatorsMaybeFactory, resolveValidatorsMaybeFactory} from "client/react/components/form/validators"
import {TreePath} from "common/tree"

type Props = {
	readonly initialValue: string
	readonly onComplete: (newValue: string | null) => void
	readonly treePath: TreePath
	readonly validators?: ValidatorsMaybeFactory<string, TreePath>
}

export const InlineTreeElementEditor = ({initialValue, onComplete, validators, treePath}: Props) => {
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

	const completeWithSuccess = useCallback(() => {
		if(!ref.current){
			return
		}
		const resolvedValidators = resolveValidatorsMaybeFactory(validators, treePath)
		const value = ref.current.value
		const hasError = !value || !!resolvedValidators?.find(x => !!x(value))
		if(hasError){
			setShaking(x => x + 1)
			setTimeout(() => setShaking(x => x - 1), 300)
		} else {
			onComplete(value)
		}
	}, [onComplete, treePath, validators])

	const onKeyDown = useCallback((e: React.KeyboardEvent) => {
		if(e.key === "Enter"){
			e.preventDefault()
			e.stopPropagation()
			completeWithSuccess()
		} else if(e.key === "Escape"){
			e.preventDefault()
			e.stopPropagation()
			onComplete(null)
		} else {
			updateValue()
		}
	}, [updateValue, completeWithSuccess, onComplete])

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
			onKeyDown={onKeyDown}
			onKeyUp={updateValue}
			onPaste={updateValue}
			onBlur={() => onComplete(null)}
			ref={ref}/>
	)
}
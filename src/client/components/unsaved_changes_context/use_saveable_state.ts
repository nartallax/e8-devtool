import {SetState} from "client/ui_utils/react_types"
import {useCallback, useRef, useState} from "react"

type UseSaveableStateResult<T> = {
	state: T
	setState: SetState<T>
	isUnsaved: boolean
	save: () => Promise<void>
	markSaved: () => void
}

/** setState that tracks if it was saved
"saved" here means "uploaded to some storage or parent state" */
export const useSaveableState = <T>(value: T, save: (currentValue: T) => void | Promise<void>): UseSaveableStateResult<T> => {
	const currentValueRef = useRef(value)
	const [currentValue, rawSetState] = useState(value)
	const [isUnsaved, setUnsaved] = useState(false)

	const setState = useCallback((valueOrCallback: T | ((old: T) => T)) => {
		let newValue: T
		if(typeof(valueOrCallback) === "function"){
			newValue = (valueOrCallback as ((old: T) => T))(currentValueRef.current)
		} else {
			newValue = valueOrCallback
		}
		currentValueRef.current = newValue
		rawSetState(newValue)
		setUnsaved(true)
	}, [])

	const saveRef = useRef(save)
	saveRef.current = save
	const doSave = useCallback(async() => {
		await Promise.resolve(saveRef.current(currentValueRef.current))
		setUnsaved(false)
	}, [])

	const markSaved = useCallback(() => setUnsaved(false), [])

	return {state: currentValue, setState, isUnsaved, save: doSave, markSaved}
}
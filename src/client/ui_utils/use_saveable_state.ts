import {SetState} from "client/ui_utils/react_types"
import {useCallback, useRef, useState} from "react"

type UseSaveableStateResult<T> = {
	state: T
	setState: SetState<T>
	isUnsaved: boolean
	save: () => Promise<void>
	saveIfUnsaved: () => Promise<void>
	markSaved: () => void
}

// TODO: actually deep-compare instead of just setting the flag each time
// right now it's not possible because we'd have to compare whole project, which is a performance hit
/** setState that tracks if it was saved
"saved" here means "uploaded to some storage or parent state" */
export const useSaveableState = <T>(value: T, save: (currentValue: T) => void | Promise<void>): UseSaveableStateResult<T> => {
	const [currentValue, rawSetState] = useState(value)
	return useWrapSaveableState(currentValue, rawSetState, save)
}

export const useWrapSaveableState = <T>(currentValue: T, rawSetState: (newValue: T) => void, save: (currentValue: T) => void | Promise<void>): UseSaveableStateResult<T> => {
	const currentValueRef = useRef(currentValue)
	currentValueRef.current = currentValue
	const [isUnsaved, setUnsaved] = useState(false)
	const isUnsavedRef = useRef(isUnsaved)
	isUnsavedRef.current = isUnsaved

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
	}, [rawSetState])

	const saveRef = useRef(save)
	saveRef.current = save
	const doSave = useCallback(async() => {
		await Promise.resolve(saveRef.current(currentValueRef.current))
		isUnsavedRef.current = false
		setUnsaved(false)
	}, [])

	const saveIfUnsaved = useCallback(async() => {
		if(isUnsavedRef.current){
			await doSave()
		}
	}, [doSave])

	const markSaved = useCallback(() => {
		setUnsaved(false)
	}, [])

	return {
		state: currentValue, setState, isUnsaved, save: doSave, saveIfUnsaved, markSaved
	}
}
import {SetState} from "client/ui_utils/react_types"
import {useCallback, useRef} from "react"

/** Create new SetState based off a value and an action that should happen when state is set
No actual state is created, but it's implied that the value is actually saved on saveState */
export const useSyntheticSetState = <T>(state: T, saveState: (value: T) => void): SetState<T> => {
	const stateRef = useRef(state)
	stateRef.current = state
	const saveRef = useRef(saveState)
	saveRef.current = saveState

	return useCallback((valueOrCallback: T | ((oldValue: T) => T)) => {
		let newValue: T
		if(typeof(valueOrCallback) === "function"){
			newValue = (valueOrCallback as ((oldValue: T) => T))(stateRef.current)
		} else {
			newValue = valueOrCallback
		}
		saveRef.current(newValue)
		stateRef.current = newValue
		return newValue
	}, [])
}

export const useWrappedSetState = <T>(rawSetState: SetState<T>, before: (newValue: T, oldValue: T) => T) => {
	const beforeRef = useRef(before)
	beforeRef.current = before

	return useCallback((valueOrCallback: T | ((oldValue: T) => T)) => {
		rawSetState(oldValue => {
			let newValue: T
			if(typeof(valueOrCallback) === "function"){
				newValue = (valueOrCallback as ((oldValue: T) => T))(oldValue)
			} else {
				newValue = valueOrCallback
			}
			newValue = beforeRef.current(newValue, oldValue)
			return newValue
		})

	}, [rawSetState])
}

export const useTransformedSetState = <O, I>(innerSetState: SetState<I>, toInner: (outer: O, oldInner: I) => I, toOuter: (inner: I) => O) => {
	const innerRef = useRef(toInner)
	innerRef.current = toInner

	const outerRef = useRef(toOuter)
	outerRef.current = toOuter

	return useCallback((valueOrCallback: O | ((oldValue: O) => O)) => {
		if(typeof(valueOrCallback) === "function"){
			innerSetState(oldInnerValue => {
				const oldOuterValue = outerRef.current(oldInnerValue)
				const newOuterValue = (valueOrCallback as ((oldValue: O) => O))(oldOuterValue)
				return innerRef.current(newOuterValue, oldInnerValue)
			})
		} else {
			innerSetState(oldInner => innerRef.current(valueOrCallback, oldInner))
		}
	}, [innerSetState])
}
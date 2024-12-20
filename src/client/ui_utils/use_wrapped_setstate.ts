import {SetState} from "client/ui_utils/react_types"
import {useCallback, useRef} from "react"

export const useWrappedSetState = <T>(rawSetState: SetState<T>, after: (newValue: T) => void) => {
	const afterRef = useRef(after)
	afterRef.current = after

	return useCallback((valueOrCallback: T | ((oldValue: T) => T)) => {
		if(typeof(valueOrCallback) === "function"){
			rawSetState(value => {
				value = (valueOrCallback as ((oldValue: T) => T))(value)
				afterRef.current(value)
				return value
			})
		} else {
			rawSetState(valueOrCallback)
			afterRef.current(valueOrCallback)
		}
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
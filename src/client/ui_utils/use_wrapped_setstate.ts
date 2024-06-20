import {SetState} from "client/ui_utils/react_types"
import {useCallback} from "react"

type Options = {
	before?: () => void
	after?: () => void
}

export const useWrappedSetState = <T>(rawSetState: SetState<T>, {before, after}: Options) => {
	return useCallback((valueOrCallback: T | ((oldValue: T) => T)) => {
		if(typeof(valueOrCallback) === "function"){
			before?.()
			rawSetState(oldValue => (valueOrCallback as ((oldValue: T) => T))(oldValue))
			after?.()
		} else {
			before?.()
			rawSetState(valueOrCallback)
			after?.()
		}
	}, [rawSetState, before, after])
}
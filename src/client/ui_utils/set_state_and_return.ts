import {SetState} from "client/ui_utils/react_types"

/** This is a way to call setState with callback and return a value
Only useful for cases when you want to get latest state, but don't want to add it to dependency list */
export const setStateAndReturn = <T, R>(setState: SetState<T>, updater: (value: T) => [T, R]): Promise<R> => {
	return new Promise(resolve => {
		setState(value => {
			const [newValue, result] = updater(value)
			resolve(result)
			return newValue
		})
	})
}
import {SetState} from "client/ui_utils/react_types"
import {useCallback, useState} from "react"

export const useLocalStorageState = <T>(key: string, defaultValue: T): [T, SetState<T>] => {
	const [value, setValue] = useState(key in localStorage ? JSON.parse(localStorage[key]) as T : defaultValue)
	const updateValue = useCallback((newValueOrCallback: T | ((oldValue: T) => T)) => {
		let newValue: T
		if(typeof(newValueOrCallback) === "function"){
			setValue(oldValue => {
				newValue = (newValueOrCallback as (oldValue: T) => T)(oldValue)
				return newValue
			})
		} else {
			newValue = newValueOrCallback
			setValue(newValue)
		}
		localStorage[key] = JSON.stringify(newValue!)
	}, [key])
	return [value, updateValue]
}
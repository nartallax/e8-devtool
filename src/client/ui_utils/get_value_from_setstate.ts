import {SetState} from "client/ui_utils/react_types"

// TODO: remove
export const getValueFromSetState = <T>(setter: SetState<T>) => new Promise<T>(ok => {
	setter(value => {
		requestAnimationFrame(() => ok(value))
		return value
	})
})
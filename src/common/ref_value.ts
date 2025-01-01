import {useRef} from "react"

export const useRefValue = <T>(value: T): {readonly current: T} => {
	const ref = useRef(value)
	ref.current = value
	return ref
}
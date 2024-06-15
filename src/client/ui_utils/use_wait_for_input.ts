import {useMemo, useRef} from "react"

type WaitForInputResult<T extends unknown[]> = {
	(...args: T): void
	cancel(): void
}

export const useWaitForInput = <T extends unknown[]>(timeMs: number, callback: (...lastCallArgs: T) => void): WaitForInputResult<T> => {
	const handlerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
	const lastArgsRef = useRef<T | null>(null)

	return useMemo(() => {
		const cancel = () => {
			if(handlerRef.current){
				clearTimeout(handlerRef.current)
			}
		}

		const result = ((...args: T) => {
			lastArgsRef.current = args
			if(handlerRef.current){
				clearTimeout(handlerRef.current)
			}
			handlerRef.current = setTimeout(() => {
				handlerRef.current = null
				const args = lastArgsRef.current!
				lastArgsRef.current = null
				callback(...args)
			}, timeMs)
		}) as WaitForInputResult<T>

		result.cancel = cancel

		return result
	}, [callback, timeMs])

}
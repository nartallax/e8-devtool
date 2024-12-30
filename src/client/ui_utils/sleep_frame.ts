export function sleepFrame<T>(result: T): Promise<T>
export function sleepFrame(): Promise<void>
export function sleepFrame<T>(result?: T) {
	return new Promise(ok => requestAnimationFrame(() => {
		ok(result)
	}))
}
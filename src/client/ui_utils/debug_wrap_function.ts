export const debugWrapFunction = <A extends unknown[], R>(fn: (...args: A) => R, name?: string) => (...args: A) => {
	console.trace(`${name ?? "Function "} is called`)
	return fn(...args)
}
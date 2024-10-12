export function nonNull<T>(value: T): value is Exclude<T, null> {
	return value !== null
}

export function nonNullOrUndefined<T>(value: T): value is Exclude<T, null | undefined> {
	return value !== null && value !== undefined
}
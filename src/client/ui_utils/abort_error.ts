/** Error that signifies aborting of some currently ongoing operation */
export class AbortError extends Error {
	readonly isAbortError = true

	constructor(message: string) {
		super(message)
	}

	static isAbortError(x: unknown): x is AbortError {
		return !!x && typeof(x) === "object" && (x as AbortError).isAbortError === true
	}
}
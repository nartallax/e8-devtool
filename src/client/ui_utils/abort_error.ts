/** Error that signifies aborting of some currently ongoing operation */
export class AbortError extends Error {
	isAbortError = true

	static isAbortError(x: unknown): x is AbortError {
		return !!x && typeof(x) === "object" && (x as AbortError).isAbortError
	}
}
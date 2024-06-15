export class ApiError extends Error {
	isApiError = true

	constructor(message: string) {
		super(message)
	}

	static isApiError(x: unknown): x is ApiError {
		return !!x && typeof(x) === "object" && (x as ApiError).isApiError === true
	}
}

export interface SuccessApiResponse<T> {
	result: T
}

export interface ErrorApiResponse {
	error: {
		message: string
	}
}

export type ApiResponse<T> = SuccessApiResponse<T> | ErrorApiResponse

export function isSuccessApiResponse(resp: ApiResponse<unknown>): resp is SuccessApiResponse<unknown> {
	return "result" in resp
}

export function errorToErrorApiResp(error: unknown): ErrorApiResponse {
	if(ApiError.isApiError(error)){
		return {error: {message: error.message}}
	} else {
		return {error: {message: "Something is borken on the server UwU"}}
	}
}
import {ApiError, ApiResponse, isSuccessApiResponse} from "common/api_response"

type ApiHttpMethod = "GET" | "POST" | "PUT"

interface ApiCallOptions {
	name: string
	body?: unknown[]
}

export class ApiClient {

	// TODO: call queue, to avoid weird concurrency bugs

	constructor(private urlBase: string, private method: ApiHttpMethod, private onApiError?: (err: ApiError) => void) {}

	private async parseResp<T>(resp: Response): Promise<T> {
		const respData: ApiResponse<unknown>[] = await resp.json()
		for(const resp of respData){
			if(isSuccessApiResponse(resp)){
				return resp.result as T
			} else {
				const err = new ApiError(resp.error.message)
				if(this.onApiError){
					this.onApiError(err)
				}
				throw err
			}
		}
		throw new Error("No response?")
	}

	async call(opts: ApiCallOptions & {resultType: "binary"}): Promise<ArrayBuffer>
	async call<T>(opts: ApiCallOptions): Promise<T>
	async call<T>(opts: ApiCallOptions): Promise<T | ArrayBuffer> {
		// TODO: batching should work somehow better
		// this is just for now
		const body: unknown[] = [opts.name]
		if(opts.body){
			body.push(opts.body)
		}
		const resp = await fetch(this.urlBase, {
			method: this.method,
			body: JSON.stringify([body])
		})
		return (await this.parseResp(resp))
	}

}
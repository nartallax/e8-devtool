import {ApiError, ApiResponse, isSuccessApiResponse} from "common/api_response"

type ApiHttpMethod = "GET" | "POST" | "PUT"
type ApiResultType = "binary" | "json"

interface ApiCallOptions {
	method?: ApiHttpMethod
	resultType?: ApiResultType
	name: string
	queryParams?: Record<string, string>
	body?: ArrayBuffer | unknown[]
}

export class ApiClient {

	constructor(private urlBase: string, private defaultMethod: ApiHttpMethod, private onApiError?: (err: ApiError) => void) {}

	private serializeBody(body: ArrayBuffer | unknown): ArrayBuffer | string {
		if(body instanceof ArrayBuffer){
			return body
		} else {
			return JSON.stringify(body)
		}
	}

	private formUrl(opts: ApiCallOptions): string {
		let queryStr = Object.entries(opts.queryParams ?? {}).map(([k, v]) => {
			return encodeURIComponent(k) + "=" + encodeURIComponent(v)
		}).join("&")
		if(queryStr){
			queryStr = "?" + queryStr
		}

		return this.urlBase + opts.name + queryStr
	}

	private async parseResp<T>(resp: Response): Promise<T> {
		const respData: ApiResponse<unknown> = await resp.json()

		if(isSuccessApiResponse(respData)){
			return respData.result as T
		} else {
			const err = new ApiError(respData.error.message)
			if(this.onApiError){
				this.onApiError(err)
			}
			throw err
		}
	}

	async call(opts: ApiCallOptions & {resultType: "binary"}): Promise<ArrayBuffer>
	async call<T>(opts: ApiCallOptions): Promise<T>
	async call<T>(opts: ApiCallOptions): Promise<T | ArrayBuffer> {
		const method = opts.method ?? this.defaultMethod
		const resp = await fetch(this.formUrl(opts), {
			method,
			body: method === "GET" ? undefined : this.serializeBody(opts.body ?? null)
		})
		return opts.resultType === "binary" ? await resp.arrayBuffer() : await this.parseResp(resp)
	}

}
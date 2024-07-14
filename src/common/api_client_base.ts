import {ApiError, ApiResponse, isSuccessApiResponse} from "common/api_response"

type ApiHttpMethod = "GET" | "POST" | "PUT"

interface ApiCallOptions {
	name: string
	body?: unknown[]
}

type BatchableCall<T> = {
	data: [name: string, args?: unknown[]]
	ok: (result: T) => void
	bad: (err: unknown) => void
}

type Batch = BatchableCall<any>[]

export class ApiClient {

	private nextBatch: Batch = []
	private runningBatch: Batch | null = null
	private batchTimer: ReturnType<typeof setTimeout> | ReturnType<typeof requestAnimationFrame> | null = null

	constructor(private urlBase: string, private method: ApiHttpMethod, private batchGatheringTime: number | "raf", private onApiError?: (err: ApiError) => void) {}

	private tryStartBatchTimer() {
		if(this.batchTimer === null){
			if(this.batchGatheringTime === "raf"){
				this.batchTimer = requestAnimationFrame(() => this.sendBatch())
			} else {
				this.batchTimer = setTimeout(() => this.sendBatch(), this.batchGatheringTime)
			}
		}
	}

	private async sendBatch() {
		if(this.runningBatch !== null || this.nextBatch.length < 1){
			return
		}

		this.batchTimer = null
		const calls = this.runningBatch = this.nextBatch
		this.nextBatch = []

		try {
			const resp = await fetch(this.urlBase, {
				method: this.method,
				body: JSON.stringify(calls.map(call => call.data))
			})

			await this.parseResp(resp, calls)
		} finally {
			this.runningBatch = null
			void this.sendBatch()
		}

	}

	private async parseResp(resp: Response, calls: BatchableCall<any>[]) {
		const respData: ApiResponse<unknown>[] = await resp.json()
		for(let i = 0; i < calls.length; i++){
			const call = calls[i]!
			const respItem = respData[i]
			if(respItem && isSuccessApiResponse(respItem)){
				call.ok(respItem.result)
			} else {
				const err = !respItem
					? new ApiError("Batched calls count differs from response items count.")
					: new ApiError(respItem.error.message)
				if(this.onApiError){
					this.onApiError(err)
				}
				call.bad(err)
			}
		}
	}

	call<T>(opts: ApiCallOptions): Promise<T> {
		return new Promise((ok, bad) => {
			const data: BatchableCall<T>["data"] = [opts.name]
			if(opts.body){
				data.push(opts.body)
			}
			const call: BatchableCall<T> = {ok, bad, data}
			this.nextBatch.push(call)
			this.tryStartBatchTimer()
		})
	}

}
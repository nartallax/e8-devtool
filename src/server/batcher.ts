import {ApiError, ApiResponse, errorToErrorApiResp} from "common/api_response"
import {errToString} from "common/err_to_string"
import {log} from "common/log"

export const batchJsonApiCalls = (api: Record<string, (...args: unknown[]) => unknown>) => {

	const batch = async(body: Buffer): Promise<Buffer> => {
		const calls = JSON.parse(body.toString("utf-8"))
		if(!Array.isArray(calls)){
			throw new Error("Bad batched call format")
		}

		const result: ApiResponse<unknown>[] = []
		for(const [fnName, maybeFnArgs] of calls){
			if(!Object.hasOwn(api, fnName)){
				result.push(errorToErrorApiResp(new ApiError("Unknown API method: " + fnName)))
				continue
			}

			const fnArgs = maybeFnArgs ?? []

			const fn = api[fnName]!
			try {
				log(`API call: ${fnName}`)
				const callRes = await Promise.resolve(fn(...fnArgs))
				result.push({result: callRes === undefined ? null : callRes})
			} catch(e){
				log(`Error calling ${fnName}(${apiMethodArgsToString(fnArgs)}): ${errToString(e)}`)
				result.push(errorToErrorApiResp(e))
			}
		}

		return Buffer.from(JSON.stringify(result), "utf-8")
	}

	return {batch}

}

function apiMethodArgsToString(methodArgs: unknown[]): string {
	return methodArgs.map(value => {
		let str = value instanceof Uint8Array ? "<binary>" : JSON.stringify(value)
		if(str.length > 500){
			str = str.substring(0, 500) + "<cut>"
		}
		return str
	}).join(", ")
}
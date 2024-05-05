import {DeepPartialFlags} from "common/deep_resolve_paths"

export type DeepPartial<T> = T extends {[key in infer K]: unknown} ? {[key in K]?: DeepPartial<T[K]>} : T

export function deepOmit<T>(src: T, flags: DeepPartialFlags<T>): DeepPartial<T> {
	// ew.
	const result: any = {...src}
	for(const key of Object.keys(flags)){
		const flagEntry = (flags as any)[key]
		if(flagEntry === true){
			delete result[key]
			continue
		}

		const valueMbArray = result[key]
		const valueArray = Array.isArray(valueMbArray) ? valueMbArray : [valueMbArray]
		const resultArray: unknown[] = []
		for(const value of valueArray){
			if(typeof(value) === "object" && value !== null){
				const resolvedValue = deepOmit(value, flagEntry)
				resultArray.push(resolvedValue)
				continue
			}

			resultArray.push(value)
		}

		// eeew.
		result[key] = (Array.isArray(valueMbArray) ? resultArray : resultArray[0]) as T[keyof T]
	}
	return result
}
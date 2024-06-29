import * as Path from "path"

export type DeepPartialFlags<T> = T extends object
	? {[key in keyof T]?: DeepPartialFlags<T[key]>}
	: T extends (infer V)[] ? DeepPartialFlags<V>
		: true


// TODO: remove? or do something else with paths
/** Iterate over all paths in config and resolve them.*/
export function deepResolvePaths<T>(rootPath: string, config: T, paths: DeepPartialFlags<T>): T {
	const result: T = {...config}
	for(const key of Object.keys(paths) as (keyof T)[]){
		const configValueMbArray = config[key]
		const configValueArray = Array.isArray(configValueMbArray) ? configValueMbArray : [configValueMbArray]
		const resultArray: unknown[] = []
		for(const configValue of configValueArray){
			if(typeof(configValue) === "string"){
				resultArray.push(Path.resolve(rootPath, configValue))
				continue
			}

			if(typeof(configValue) === "object" && configValue !== null){
				const nestedPaths = paths[key as keyof typeof paths] // ew.
				if(typeof(nestedPaths) === "object"){
					const resolvedValue = deepResolvePaths(rootPath, configValue, nestedPaths as any) // eew.
					resultArray.push(resolvedValue)
					continue
				}
			}

			resultArray.push(configValue)
		}

		// eeew.
		result[key] = (Array.isArray(configValueMbArray) ? resultArray : resultArray[0]) as T[keyof T]
	}
	return result
}
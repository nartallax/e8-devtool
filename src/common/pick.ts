export const pick = <T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> => {
	const result: Partial<T> = {}
	for(const key of keys){
		result[key] = obj[key]
	}
	return result as Pick<T, K>
}
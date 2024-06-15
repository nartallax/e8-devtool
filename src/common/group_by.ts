export function groupBy<T, K>(values: T[], getGroupKey: (value: T) => K): [K, T[]][] {
	return [...groupByToMap(values, getGroupKey).entries()]
}

export function groupByToMap<T, K>(values: T[], getGroupKey: (value: T) => K): Map<K, T[]> {
	const map = new Map<K, T[]>()
	for(const value of values){
		const key = getGroupKey(value)
		let arr = map.get(key)
		if(!arr){
			arr = []
			map.set(key, arr)
		}
		arr.push(value)
	}
	return map
}
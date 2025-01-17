
export function filterObject<V>(map: Record<string, V>, predicate: (k: string, v: V) => boolean): Record<string, V>
export function filterObject<K extends string, V>(map: Record<K, V>, predicate: (k: K, v: V) => boolean): Partial<Record<K, V>>
export function filterObject<K extends string, V>(map: Record<K, V>, predicate: (k: K, v: V) => boolean): Partial<Record<K, V>> {
	const result: Partial<Record<K, V>> = {}
	for(const key in map){
		const value = map[key]
		if(predicate(key, value)){
			result[key] = value
		}
	}
	return result
}

export function filterMap<K, V>(map: ReadonlyMap<K, V>, predicate: (k: K, v: V) => boolean): Map<K, V> {
	const result: [K, V][] = []
	for(const [k, v] of map.entries()){
		if(predicate(k, v)){
			result.push([k, v])
		}
	}
	return new Map(result)
}
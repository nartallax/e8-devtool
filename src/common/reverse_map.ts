export function reverseMap<K, V>(map: ReadonlyMap<K, V>): Map<V, K>
export function reverseMap<K, V, KK>(map: ReadonlyMap<K, V>, getKey: (key: K, value: V) => KK): Map<KK, K>
export function reverseMap<K, V, KK>(map: ReadonlyMap<K, V>, getKey: (key: K, value: V) => KK = (_, value) => value as unknown as KK): Map<KK, K> {
	const result: [KK, K][] = []
	for(const [k, v] of map.entries()){
		result.push([getKey(k, v), k])
	}
	return new Map(result)
}

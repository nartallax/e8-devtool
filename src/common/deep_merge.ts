/** Merge two objects.
 * Think of it like {...a, ...b}, just deep - it does the same for nested objects
 * Intended for cases when you have ethalon value, like default values of config (@param base),
 * but you also have actual config (@param patch),
 * and you need to get effective config
 * @returns [merge result, is result any different from @param patch]*/
export function deepMerge<T>(base: T, patch: Partial<T>): [result: T, hasChange: boolean] {
	if(typeof(patch) !== "object" || patch === null){
		return [base, true]
	}

	if(typeof(base) !== "object" || base === null){
		throw new Error("Expected non-null object as base value.")
	}

	const result: Partial<T> = {}
	let hasChange = false
	const keys = new Set(Object.keys(base) as (keyof T)[])
	for(const k of keys){
		if(!(k in patch)){
			hasChange = true
			result[k] = base[k]
			continue
		}

		let patchValue = patch[k]
		if(typeof(patchValue) === "object" && patchValue !== null){
			const [mergedValue, hasNestedChange] = deepMerge(base[k], patchValue)
			hasChange = hasChange || hasNestedChange
			patchValue = mergedValue
		}

		result[k] = patchValue!
	}

	return [result as T, hasChange]
}
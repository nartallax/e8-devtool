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
	if(Array.isArray(base)){
		if(!Array.isArray(patch)){
			return [base, true]
		}
		if(base.length < 1){
			return [patch as T, false]
			// TODO: bring this back
			// to do this, we should be able to have built-in textures
			// until then we're not able to make a "blank" model if we don't have texture directory
			// throw new Error("Cannot deep-merge with 0 elements in example array.")
		}
		const anyElement = base[0]!
		let hasChange = false
		const result = patch.map(el => {
			const [newEl, hasElChange] = deepMergeElement(anyElement, el)
			hasChange ||= hasElChange
			return newEl
		}) as T
		return [result, false]
	}

	const keys = new Set(Object.keys(base) as (keyof T)[])
	for(const k of keys){
		if(!(k in patch)){
			hasChange = true
			result[k] = base[k]
			continue
		}

		const [fieldValue, fieldHasChange] = deepMergeElement(base[k], patch[k])
		hasChange ||= fieldHasChange
		result[k] = fieldValue
	}

	return [result as T, hasChange]
}

const deepMergeElement = <T>(baseValue: T, patchValue: unknown): [result: T, hasChange: boolean] => {
	if(typeof(patchValue) === "object" && patchValue !== null){
		return deepMerge(baseValue, patchValue)
	}

	// we explicitly don't process case typeof(baseValue) !== typeof(patchValue)
	// because it will ruin some patterns, like nullable fields
	return [patchValue as T, false]
}

import {SetState} from "client/ui_utils/react_types"
import {useSaveableState} from "client/ui_utils/use_saveable_state"
import {useEffect} from "react"

type QueryDefinition<T> = {
	didFetchStartOnce: boolean
	didFetchEndOnce: boolean
	fetchAndUpdate: () => Promise<void>
	currentValue: T
	onValueFetched: Set<(newValue: T) => void>
	onSaveRequested: Set<() => Promise<void>>
}

export type Query<T> = [
	value: T,
	setValue: SetState<T>,
	{
		save: () => Promise<void>
		isUnsaved: boolean
		isSaveable: boolean
		isLoaded: boolean
		saveIfUnsaved: () => Promise<void>
		markSaved: () => void
	}
]

const activeQueries = new Map<string, QueryDefinition<any>>()

export const saveAllSaveableQueries = async() => {
	const saveHandlers = [...activeQueries.values()].flatMap(query => [...query.onSaveRequested])
	await Promise.all(saveHandlers.map(handler => handler()))
}

const throwOnSave = () => {
	throw new Error("Saving is not supported for this query.")
}

type QueryParams<T> = {
	keys: string[]
	default: T
	fetch: () => Promise<T>
	save?: (value: T) => Promise<void>
}

export const useQuery = <T>({
	keys, default: dflt, fetch, save: doSave
}: QueryParams<T>): Query<T> => {
	const isSaveable = !!doSave
	doSave ??= throwOnSave

	const cacheKey = JSON.stringify(keys)
	let def = activeQueries.get(cacheKey)
	if(!def){
		def = {
			fetchAndUpdate: async() => {
				def!.didFetchStartOnce = true
				const value = await fetch()
				def!.currentValue = value
				def!.didFetchEndOnce = true
				for(const handler of def!.onValueFetched){
					// this can overwrite changes made to state without saving them
					// but it won't happen in the cases I'm having, so whatever
					// if this ever happens - maybe I should have an additional parameter or smth
					handler(value)
				}
			},
			didFetchStartOnce: false,
			didFetchEndOnce: false,
			currentValue: dflt,
			onValueFetched: new Set(),
			onSaveRequested: new Set()
		}
		activeQueries.set(cacheKey, def)
	}

	const saveMutation = useMutation({
		keys,
		mutate: async(value: T) => {
			if(!def.didFetchEndOnce){
				// if we didn't fetch value even once - then we have nothing to save
				// we must not overwrite value with default one
				return
			}
			await doSave(value)
		}
	})

	const {
		state: value, setState: setValue, isUnsaved, save, saveIfUnsaved, markSaved
	} = useSaveableState<T>(def.currentValue, saveMutation)

	useEffect(() => {
		const doOnValueFetched = (value: T) => {
			setValue(value)
			markSaved()
		}

		const doOnSaveRequested = async() => {
			if(isSaveable){
				await saveIfUnsaved()
			}
		}

		def.onValueFetched.add(doOnValueFetched)
		def.onSaveRequested.add(doOnSaveRequested)

		// this is more of a safety precaution, no real case when it was required exists.
		// when we add def to active outside of use effect, we don't add handler immediately.
		// because of that there's a brief moment of time when def is in the set but has no handlers.
		// this state is slighly illegal, because defs without handlers must not be in the active set.
		// and they can be deleted by another query with same cache keys if that query is unloading,
		// that's why it's better to check here, just to be safe
		if(!activeQueries.has(cacheKey)){
			activeQueries.set(cacheKey, def)
		}

		// each time def is changed - that means cache key is changed
		// and that means query arguments are changed, or so we assume
		// that's why we must reset state value, otherwise it will retain old value fetched with different arguments
		doOnValueFetched(def.currentValue)

		if(!def.didFetchStartOnce){
			void def.fetchAndUpdate()
		}

		return () => {
			def.onValueFetched.delete(doOnValueFetched)
			def.onSaveRequested.delete(doOnSaveRequested)
			if(def.onValueFetched.size === 0){
				activeQueries.delete(cacheKey)
			}

			if(isSaveable){
				void saveIfUnsaved()
			}
		}
	}, [def, cacheKey, isSaveable, setValue, markSaved, saveIfUnsaved])

	return [value, setValue, {
		isUnsaved,
		isSaveable,
		isLoaded: def.didFetchEndOnce,
		save,
		saveIfUnsaved,
		markSaved
	}]
}



type MutationParams<I extends unknown[]> = {
	keys: string[]
	mutate: (...args: I) => Promise<void>
}

type Mutation<I extends unknown[]> = (...args: I) => Promise<void>

export const useMutation = <I extends unknown[]>({keys, mutate}: MutationParams<I>): Mutation<I> => {
	return async(...args: I) => {
		const promises: Promise<unknown>[] = [mutate(...args)]
		outer: for(const [key, query] of activeQueries){

			const parsedKey = JSON.parse(key)
			for(let i = 0; i < keys.length; i++){
				if(parsedKey[i] !== keys[i]){
					continue outer
				}
			}

			promises.push(query.fetchAndUpdate())
		}

		await Promise.all(promises)
	}
}

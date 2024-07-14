import {useEffect, useState} from "react"

type QueryDefinition<I extends unknown[], O> = {
	args: I
	fetchAndUpdate: () => Promise<void>
	currentValue: O | null
	onValueChanged: Set<(newValue: O) => void>
}

type Query<I extends unknown[], O> = {
	useValue: (...args: I) => O | null
	getValue: (...args: I) => Promise<O>
}

type Mutation<I extends unknown[]> = (...args: I) => Promise<void>

const activeQueries = new Map<string, QueryDefinition<any, any>>()

const makeQuery = <I extends unknown[], O>(prefixes: string[], getValue: (...args: I) => Promise<O>): Query<I, O> => {
	const useValue = (...args: I) => {
		const cacheKey = JSON.stringify([...prefixes, ...args])
		let def = activeQueries.get(cacheKey)
		if(!def){
			def = {
				args,
				fetchAndUpdate: async() => {
					const value = await getValue(...args)
					def!.currentValue = value
					for(const handler of def!.onValueChanged){
						handler(value)
					}
				},
				currentValue: null,
				onValueChanged: new Set()
			}
			activeQueries.set(cacheKey, def)
			void def.fetchAndUpdate()
		}

		const [value, setValue] = useState<O | null>(def.currentValue)

		useEffect(() => {
			def.onValueChanged.add(setValue)
			return () => {
				def.onValueChanged.delete(setValue)
				if(def.onValueChanged.size === 0){
					activeQueries.delete(cacheKey)
				}
			}
		}, [def, cacheKey])

		return value
	}

	return {useValue, getValue}
}

const makeMutation = <I extends unknown[]>(prefixes: string[], mutate: (...args: I) => Promise<void>): Mutation<I> => {
	return async(...args: I) => {
		const promises: Promise<unknown>[] = [mutate(...args)]
		outer: for(const [key, query] of activeQueries){

			const parsedKey = JSON.parse(key)
			for(let i = 0; i < prefixes.length; i++){
				if(parsedKey[i] !== prefixes[i]){
					continue outer
				}
			}

			promises.push(query.fetchAndUpdate())
		}

		await Promise.all(promises)
	}
}

type QueryGroupMaker = {
	query: <I extends unknown[], O>(getValue: (...args: I) => Promise<O>) => Query<I, O>
	mutation: <I extends unknown[]>(mutate: (...args: I) => Promise<void>) => Mutation<I>
}

/** A set of queries and mutators, both implied to be HTTP requests.
Queries can be used all across the app, and will be loaded once at most.
Mutators are supposed to change some data; After a mutator is called, all active queries related to that mutator are re-fetched.
This works best if queries are batched or at least queued; this function expects this from requestor */
export const makeQueryGroup = <R>(prefixes: string[], makeGroup: (maker: QueryGroupMaker) => R): R => {
	const maker: QueryGroupMaker = {
		query: getValue => makeQuery(prefixes, getValue),
		mutation: mutate => makeMutation(prefixes, mutate)
	}

	return makeGroup(maker)
}
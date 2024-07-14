/** A set of queries and mutators, both being HTTP requests.
Queries can be used all across the app, and will be loaded once at most.
Mutators are supposed to change some data; doing so invalidate queries, so they'll need to re-fetch the data
All those requests - for mutation and for revalidation - are both batched together to be sent as single HTTP request */
// export const createBatchableQuerySet = () => {
// 	const addQuery = <I extends unknown[], O extends unknown[]>(makeBatchableRequest: (...args: I) => ({name: string, body?: O})) => {
// 	}
// }
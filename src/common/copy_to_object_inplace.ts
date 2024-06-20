/**
Copy properfies from @param from to @param to.
Potentially unsafe thing to do; won't respect some `readonly` modifiers for example.
*/
export const shallowCopyToObjectInplace = <T>(from: T, to: T) => {
	for(const key in from){
		to[key] = from[key]
	}
}
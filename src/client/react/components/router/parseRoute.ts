type QueryParamMatcher = {
	partName: string
	isOptional: boolean
	type: "queryParam"
}

type PathPartMatcher = {
	partName: string
	type: "pathPart"
}

export type ParsedRoute = {
	readonly path: (string | PathPartMatcher)[]
	readonly query: Record<string, string | QueryParamMatcher>
}

export type RouteRenderer = (params: Record<string, string>) => React.ReactNode
export type RouteDefinition = [routePattern: string, renderRoute: RouteRenderer]

export type RouteMatchingResult = {
	nonMatchedUrl: URL
	matchedUrl: URL
	arguments: Record<string, string>
	routePattern: string
	renderer: RouteRenderer
}

export const matchRoutes = (
	{nonMatchedUrl, matchedUrl, routes}: {nonMatchedUrl: URL, matchedUrl: URL, routes: RouteDefinition[]}
): RouteMatchingResult | null => {
	for(const [routePattern, renderer] of routes){
		const parsedRoute = parseRoute(routePattern)
		const args = extractRouteArgs(parsedRoute, nonMatchedUrl)
		if(!args){
			continue
		}

		const newNonMatchedUrl = stripUsedRouteParts(parsedRoute, nonMatchedUrl)
		const newMatchedUrl = appendUsedRouteParts(parsedRoute, args, matchedUrl)

		return {matchedUrl: newMatchedUrl, nonMatchedUrl: newNonMatchedUrl, arguments: args, renderer, routePattern}
	}

	return null
}

const parseRoute = (route: string): ParsedRoute => {
	const url = new URL(route, "http://localhost")

	const pathParts = (url.pathname ?? "").split("/").filter(x => x.length > 0)
	const path: ParsedRoute["path"] = pathParts.map(pathPart => {
		if(pathPart.startsWith(":")){
			return {
				type: "pathPart",
				partName: pathPart.substring(1)
			}
		}

		return pathPart
	})

	const query: ParsedRoute["query"] = {}
	for(const [paramName, value] of url.searchParams.entries()){
		if(value.startsWith(":")){
			const isOptional = paramName.endsWith("?")
			const fixedParamName = !isOptional ? paramName : paramName.substring(0, paramName.length - 1)
			query[fixedParamName] = {
				type: "queryParam",
				isOptional,
				partName: value.substring(1)
			}
			continue
		}

		query[paramName] = value
	}

	return {query, path}
}

const extractRouteArgs = (route: ParsedRoute, url: URL): Record<string, string> | null => {
	const matchedQuery = matchQuery(route.query, url)
	const matchedPath = matchPath(route.path, url)
	if(!matchedQuery || !matchedPath){
		return null
	}

	return {...matchedPath, ...matchedQuery}
}

const stripUsedRouteParts = (route: ParsedRoute, url: URL): URL => {
	const path = "/" + url.pathname
		.split("/")
		.slice(route.path.length + 1) // +1 here because `pathname` always starts with /
		.join("/")

	const query = [...url.searchParams.entries()]
		.filter(([paramName]) => !(paramName in route.query))
		.map(([k, v]) => encodeURIComponent(k) + "=" + encodeURIComponent(v))
		.join("&")

	const pathAndQuery = path + (query ? "?" + query : "")

	return new URL(pathAndQuery, url)
}

const appendUsedRouteParts = (route: ParsedRoute, match: Record<string, string>, url: URL): URL => {
	const queryParts = [...url.searchParams.entries()]
	for(const [paramName, matcher] of Object.entries(route.query)){
		if(typeof(matcher) === "string"){
			queryParts.push([paramName, matcher])
			continue
		}

		const arg = match[matcher.partName]
		if(arg !== undefined){
			queryParts.push([paramName, arg])
		}
	}

	const pathParts = url.pathname.split("/").filter(part => part.length > 0)
	for(const matcher of route.path){
		if(typeof(matcher) === "string"){
			pathParts.push(matcher)
			continue
		}

		const arg = match[matcher.partName]
		if(arg !== undefined){
			pathParts.push(arg)
		}
	}

	const path = "/" + pathParts.join("/")
	const query = queryParts.length === 0
		? ""
		: "?" + queryParts
			.map(([k, v]) => encodeURIComponent(k) + "=" + encodeURIComponent(v))
			.join("&")

	return new URL(path + query, url.origin)
}

const matchPath = (matchers: ParsedRoute["path"], url: URL): Record<string, string> | null => {
	const result: Record<string, string> = {}
	const pathParts = (url.pathname ?? "").split("/").slice(1)
	for(let i = 0; i < matchers.length; i++){
		const matcher = matchers[i]!
		const pathPart = pathParts[i]
		if(pathPart === undefined){
			return null
		}

		if(typeof(matcher) === "string"){
			if(pathPart !== matcher){
				return null
			}
			continue
		}

		result[matcher.partName] = pathPart
	}

	return result
}

const matchQuery = (query: ParsedRoute["query"], url: URL): Record<string, string> | null => {
	const result: Record<string, string> = {}

	for(const [paramName, matcher] of Object.entries(query)){
		const value = url.searchParams.get(paramName)
		if(value === null){
			if(typeof(matcher) === "object" && matcher.isOptional){
				continue
			}
			return null
		}

		if(typeof(matcher) === "string"){
			if(value !== matcher){
				return null
			}
			continue
		}

		result[matcher.partName] = value
	}

	return result
}
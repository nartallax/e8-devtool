import {RouteDefinition, RouteMatchingResult, matchRoutes} from "client/react/components/router/parseRoute"
import {RoutingContext, useRoutingContext} from "client/react/components/router/routingContext"
import {Vanisher} from "client/react/components/vanisher/vanisher"
import {useEffect, useState} from "react"


type Props = {
	readonly routes: RouteDefinition[]
	readonly onMatchedUrlUpdate?: (url: URL | null) => void
}

export const Router = ({routes, onMatchedUrlUpdate}: Props) => {
	const {nonMatchedUrl: oldNonMatchedUrl, matchedUrl: oldMatchedUrl} = useRoutingContext()
	const [routeMatch, setRouteMatch] = useState<RouteMatchingResult | null>(null)

	useEffect(() => {
		const newRouteMatch = matchRoutes({
			nonMatchedUrl: oldNonMatchedUrl,
			matchedUrl: oldMatchedUrl,
			routes
		})
		if((newRouteMatch === null) !== (routeMatch === null) || (newRouteMatch?.matchedUrl + "") !== (routeMatch?.matchedUrl + "")){
			setRouteMatch(newRouteMatch)
			onMatchedUrlUpdate?.(newRouteMatch?.matchedUrl ?? null)
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [oldNonMatchedUrl + "", oldMatchedUrl + "", routes])


	return !routeMatch ? null : (
		<RoutingContext.Provider value={{nonMatchedUrl: routeMatch.nonMatchedUrl, matchedUrl: routeMatch.matchedUrl}}>
			<Vanisher key={routeMatch.routePattern}>
				{routeMatch.renderer(routeMatch.arguments)}
			</Vanisher>
		</RoutingContext.Provider>
	)
}
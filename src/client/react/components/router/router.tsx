import {RouteDefinition, RouteMatchingResult, matchRoutes} from "client/react/components/router/parseRoute"
import {RoutingContext, useRoutingContext} from "client/react/components/router/routingContext"
import {Col} from "client/react/components/rowCol/rowCol"
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
		console.log(routes[0]?.[0], {oldMatchedUrl: oldMatchedUrl + "", oldNonMatchedUrl: oldNonMatchedUrl + "", newMatchedUrl: newRouteMatch?.matchedUrl + "", newNonMatchedUrl: newRouteMatch?.nonMatchedUrl + ""})
		const hasMatchChanged = (newRouteMatch === null) !== (routeMatch === null)
		const matchedUrlChanged = (newRouteMatch?.matchedUrl + "") !== (routeMatch?.matchedUrl + "")
		const nonMatchedUrlChanged = (newRouteMatch?.nonMatchedUrl + "") !== (routeMatch?.nonMatchedUrl + "")
		if(hasMatchChanged || matchedUrlChanged || nonMatchedUrlChanged){
			setRouteMatch(newRouteMatch)
			onMatchedUrlUpdate?.(newRouteMatch?.matchedUrl ?? null)
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [oldNonMatchedUrl + "", oldMatchedUrl + "", routes])


	return !routeMatch ? null : (
		<RoutingContext.Provider value={{nonMatchedUrl: routeMatch.nonMatchedUrl, matchedUrl: routeMatch.matchedUrl}}>
			<Col grow={1} shrink={1} alignSelf="stretch">
				<Vanisher key={routeMatch.routePattern}>
					{routeMatch.renderer(routeMatch.arguments)}
				</Vanisher>
			</Col>
		</RoutingContext.Provider>
	)
}
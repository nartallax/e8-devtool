import {RouteDefinition, RouteMatchingResult, matchRoutes} from "client/react/components/router/parseRoute"
import {RoutingContext, useRoutingContext} from "client/react/components/router/routingContext"
import {Col} from "client/react/components/rowCol/rowCol"
import {Vanisher} from "client/react/components/vanisher/vanisher"
import {useEffect, useRef, useState} from "react"


type Props = {
	readonly routes: RouteDefinition[]
	readonly onMatchedUrlUpdate?: (url: URL | null) => void
}

export const Router = ({routes, onMatchedUrlUpdate}: Props) => {
	const {nonMatchedUrl: oldNonMatchedUrl, matchedUrl: oldMatchedUrl} = useRoutingContext()
	const [routeMatch, setRouteMatch] = useState<RouteMatchingResult | null>(null)
	const everCalledUpdateHandler = useRef(false)

	useEffect(() => {
		const newRouteMatch = matchRoutes({
			nonMatchedUrl: oldNonMatchedUrl,
			matchedUrl: oldMatchedUrl,
			routes
		})
		const hasMatchChanged = (newRouteMatch === null) !== (routeMatch === null)
		const matchedUrlChanged = (newRouteMatch?.matchedUrl + "") !== (routeMatch?.matchedUrl + "")
		const nonMatchedUrlChanged = (newRouteMatch?.nonMatchedUrl + "") !== (routeMatch?.nonMatchedUrl + "")
		if(hasMatchChanged || matchedUrlChanged || nonMatchedUrlChanged || !everCalledUpdateHandler.current){
			everCalledUpdateHandler.current = true
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
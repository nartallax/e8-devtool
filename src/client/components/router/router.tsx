import {RouteDefinition, RouteMatchingResult, matchRoutes} from "client/components/router/parse_route"
import {RoutingContextProvider, useRoutingContext} from "client/components/router/routing_context"
import {Col} from "client/components/row_col/row_col"
import {Vanisher} from "client/components/vanisher/vanisher"
import {forwardRef, useEffect, useRef, useState} from "react"


type Props = {
	routes: RouteDefinition[]
	onMatchedUrlUpdate?: (url: URL | null) => void
}

export const Router = forwardRef<HTMLDivElement, Props>(({routes, onMatchedUrlUpdate}, ref) => {

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


	return !routeMatch ? <span ref={ref}/> : (
		<RoutingContextProvider nonMatchedUrl={routeMatch.nonMatchedUrl} matchedUrl={routeMatch.matchedUrl}>
			<Col
				grow={1}
				shrink={1}
				alignSelf="stretch"
				ref={ref}>
				<Vanisher key={routeMatch.routePattern}>
					{routeMatch.renderer(routeMatch.arguments)}
				</Vanisher>
			</Col>
		</RoutingContextProvider>
	)
})
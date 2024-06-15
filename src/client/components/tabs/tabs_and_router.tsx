import {RouteRenderer} from "client/components/router/parse_route"
import {Router} from "client/components/router/router"
import {RouteTab, RouteTabs} from "client/components/tabs/route_tabs"
import {useState} from "react"

type Tab = RouteTab & {render: RouteRenderer}

type Props = {
	tabs: Tab[]
}

export const TabsAndRouter = ({tabs}: Props) => {
	const [matchedUrl, setMatchedUrl] = useState<URL | null | undefined>(undefined)

	return (
		<>
			<RouteTabs tabs={tabs} matchedUrl={matchedUrl ?? undefined} isAutoRoutingToDefaultEnabled={matchedUrl !== undefined}/>
			<Router routes={tabs.map(tab => [tab.suffix, tab.render])} onMatchedUrlUpdate={setMatchedUrl}/>
		</>
	)
}
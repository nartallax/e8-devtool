import {RouteRenderer} from "client/react/components/router/parseRoute"
import {Router} from "client/react/components/router/router"
import {RouteTab, RouteTabs} from "client/react/components/tabs/routeTabs"
import {useState} from "react"

type Tab = RouteTab & {render: RouteRenderer}

type Props = {
	readonly tabs: Tab[]
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
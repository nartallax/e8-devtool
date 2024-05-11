import {Router} from "client/react/components/router/router"
import {RouteTabs} from "client/react/components/tabs/routeTabs"
import {ComponentProps, useState} from "react"

type Props = {
	readonly tabs: ComponentProps<typeof RouteTabs>["tabs"]
	readonly routes: ComponentProps<typeof Router>["routes"]
}

export const TabsAndRouter = ({tabs, routes}: Props) => {
	const [matchedUrl, setMatchedUrl] = useState<URL | null>(null)

	return (
		<>
			<RouteTabs tabs={tabs} matchedUrl={matchedUrl ?? undefined}/>
			<Router routes={routes} onMatchedUrlUpdate={setMatchedUrl}/>
		</>
	)
}
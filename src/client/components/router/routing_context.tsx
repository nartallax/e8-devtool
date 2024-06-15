import {useLocation} from "client/components/router/use_location"
import {defineContext} from "client/ui_utils/define_context"
import {PropsWithChildren} from "react"

type RoutingContextValue = {
	nonMatchedUrl: URL
	matchedUrl: URL
}

export const [RoutingContextProvider, useRoutingContext] = defineContext({
	name: "RoutingContext",
	useValue: (value: RoutingContextValue) => value
})

export const RootRoutingContextProvider = ({children}: PropsWithChildren) => {
	const nonMatchedUrl = useLocation()
	const matchedUrl = new URL("/", window.location + "")
	return <RoutingContextProvider nonMatchedUrl={nonMatchedUrl} matchedUrl={matchedUrl}>{children}</RoutingContextProvider>
}
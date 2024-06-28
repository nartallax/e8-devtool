import {useLocation} from "client/components/router/use_location"
import {AbortError} from "client/ui_utils/abort_error"
import {defineContext} from "client/ui_utils/define_context"
import {PropsWithChildren, useCallback, useEffect, useRef} from "react"

type NavHandlerArgs = {
	newLocation: URL
}

type NavHandler = (args: NavHandlerArgs) => void | Promise<void>

type RoutingContextValue = {
	nonMatchedUrl: URL
	matchedUrl: URL
	beforeNavigationHandlers: Set<NavHandler>
	navigate: (newLocation: URL) => void
}

export const [RoutingContextProvider, useRoutingContext] = defineContext({
	name: "RoutingContext",
	useValue: (value: RoutingContextValue) => value
})

export const RootRoutingContextProvider = ({children}: PropsWithChildren) => {
	const nonMatchedUrl = useLocation()
	const matchedUrl = new URL("/", window.location + "")
	const beforeNavigationHandlers = useRef(new Set<NavHandler>()).current

	const navigate = useCallback(async(newLocation: URL) => {
		try {
			const args: NavHandlerArgs = {newLocation}
			for(const handler of beforeNavigationHandlers){
				await Promise.resolve(handler(args))
			}
		} catch(e){
			if(!AbortError.isAbortError(e)){
				throw e
			}
			return
		}
		window.history.pushState(null, "", newLocation)
	}, [beforeNavigationHandlers])

	return (
		<RoutingContextProvider
			nonMatchedUrl={nonMatchedUrl}
			matchedUrl={matchedUrl}
			beforeNavigationHandlers={beforeNavigationHandlers}
			navigate={navigate}>
			{children}
		</RoutingContextProvider>
	)
}

export const useBeforeNavigation = (handler: NavHandler) => {
	const ref = useRef(handler)
	ref.current = handler
	const {beforeNavigationHandlers} = useRoutingContext()

	useEffect(() => {
		const handler = (args: NavHandlerArgs) => ref.current(args)
		beforeNavigationHandlers.add(handler)
		return () => {
			beforeNavigationHandlers.delete(handler)
		}
	}, [beforeNavigationHandlers])
}
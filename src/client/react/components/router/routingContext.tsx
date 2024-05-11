import {useLocation} from "client/react/components/router/useLocation"
import {PropsWithChildren, createContext, useContext} from "react"

const defaultRoutingContext = {
	matchedUrl: new URL("/", window.location + ""),
	nonMatchedUrl: new URL(window.location + "")
}

export const RoutingContext = createContext(defaultRoutingContext)

export const RoutingContextProvider = ({children}: PropsWithChildren) => {
	const nonMatchedUrl = useLocation()
	const matchedUrl = new URL("/", window.location + "")
	return (
		<RoutingContext.Provider value={{nonMatchedUrl, matchedUrl}}>
			{children}
		</RoutingContext.Provider>
	)
}

export const useRoutingContext = () => useContext(RoutingContext)
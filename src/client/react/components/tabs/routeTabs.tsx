import {useRoutingContext} from "client/react/components/router/routingContext"
import {Tabs} from "client/react/components/tabs/tabs"
import {Icon} from "generated/icons"
import {useEffect} from "react"

export type RouteTab = {
	suffix: string
	text?: string
	icon?: Icon
	isDefault?: boolean
	hotkey?: (e: KeyboardEvent) => boolean
}

type Props = {
	readonly tabs: RouteTab[]
	readonly historyActionType?: "push" | "replace"
	readonly matchedUrl?: URL
	readonly isAutoRoutingToDefaultEnabled?: boolean
}

export const RouteTabs = ({tabs, historyActionType = "push", matchedUrl, isAutoRoutingToDefaultEnabled = false}: Props) => {
	const {matchedUrl: baseUrl} = useRoutingContext()
	const effMatchedUrl = matchedUrl ?? baseUrl

	useEffect(() => {
		if(!isAutoRoutingToDefaultEnabled){
			return
		}
		const matchingTab = tabs.find(tab => isMatching(tab, effMatchedUrl))
		if(matchingTab){
			return
		}
		const defaultTab = tabs.find(tab => tab.isDefault)
		if(!defaultTab){
			return
		}
		goToTab(baseUrl, defaultTab, historyActionType)
	}, [effMatchedUrl, tabs, baseUrl, historyActionType, isAutoRoutingToDefaultEnabled])

	return (
		<Tabs tabs={tabs.map(tab => ({
			key: tab.suffix,
			text: tab.text,
			icon: tab.icon,
			hotkey: tab.hotkey,
			isActive: isMatching(tab, effMatchedUrl),
			onClick: () => goToTab(baseUrl, tab, historyActionType)
		}))}/>
	)
}

const isMatching = (tab: RouteTab, url: URL): boolean => {
	return url.pathname.startsWith(tab.suffix)
}

const goToTab = (baseUrl: URL, tab: RouteTab, historyActionType: Props["historyActionType"]) => {
	const target = new URL(tab.suffix, baseUrl)
	switch(historyActionType){
		case "push":
			window.history.pushState(null, "", target)
			return
		case "replace":
			window.history.replaceState(null, "", target)
			return
	}
}
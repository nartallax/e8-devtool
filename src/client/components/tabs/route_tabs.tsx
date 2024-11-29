import {useRoutingContext} from "client/components/router/routing_context"
import {Tabs} from "client/components/tabs/tabs"
import {mergeUrls} from "client/ui_utils/urls"
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
	tabs: RouteTab[]
	matchedUrl?: URL
	isAutoRoutingToDefaultEnabled?: boolean
}

export const RouteTabs = ({tabs, matchedUrl, isAutoRoutingToDefaultEnabled = false}: Props) => {
	const {matchedUrl: baseUrl, navigate} = useRoutingContext()
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
		navigate(mergeUrls(baseUrl, defaultTab.suffix))
	}, [effMatchedUrl, tabs, baseUrl, isAutoRoutingToDefaultEnabled, navigate])

	const matchingTabSuffix = tabs
		.filter(tab => isMatching(tab, effMatchedUrl))
		.map(tab => tab.suffix)
		.reduce((a, b) => a.length > b.length ? a : b, "")

	return (
		<Tabs tabs={tabs.map(tab => ({
			key: tab.suffix,
			text: tab.text,
			icon: tab.icon,
			hotkey: tab.hotkey,
			isActive: tab.suffix === matchingTabSuffix,
			onClick: () => {
				navigate(mergeUrls(baseUrl, tab.suffix))
			}
		}))}
		/>
	)
}

const isMatching = (tab: RouteTab, url: URL): boolean => {
	return url.pathname.startsWith(tab.suffix)
}
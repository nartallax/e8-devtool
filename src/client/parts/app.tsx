import {Form} from "client/components/form/form"
import {RootRoutingContextProvider} from "client/components/router/routing_context"
import {TabsAndRouter} from "client/components/tabs/tabs_and_router"
import {TitleProvider} from "client/components/title_context/title_context"
import {ToastProvider} from "client/components/toast/toast_context"
import {ToastDisplay} from "client/components/toast/toast_list"
import {ApiProvider} from "client/parts/api_context"
import {GlobalHotkeyManager} from "client/parts/global_hotkeys/global_hotkey_manager"
import {PropsWithChildren} from "react"
import faviconDefault from "../favicon.svg"
import {Favicon} from "client/components/favicon/favicon"
import {HotkeyProvider} from "client/components/hotkey_context/hotkey_context"
import {ModalProviders} from "client/components/modal/modal_providers"
import {SettingsPage} from "client/parts/settings_page/settings_page"
import {useFsForest} from "client/data/fs_forest_provider"
import {TableExample} from "client/components/table/table_example"

export const App = () => (
	<Providers>
		<Content/>
	</Providers>
)

/** Not app-specific providers */
const CommonProviders = ({children}: PropsWithChildren) => (
	<TitleProvider defaultTitle="E8 devtool">
		<ToastProvider>
			<HotkeyProvider>
				<ModalProviders>
					<Form>
						{children}
					</Form>
				</ModalProviders>
			</HotkeyProvider>
		</ToastProvider>
	</TitleProvider>
)

const AppProviders = ({children}: PropsWithChildren) => {
	return (
		<ApiProvider>
			<RootRoutingContextProvider>
				{children}
			</RootRoutingContextProvider>
		</ApiProvider>
	)
}

const Providers = ({children}: PropsWithChildren) => (
	<CommonProviders>
		<AppProviders>
			{children}
		</AppProviders>
	</CommonProviders>
)

const Content = () => {
	const {isLoaded: isForestLoaded} = useFsForest()

	if(!isForestLoaded){
		return null
	}

	return (
		<GlobalHotkeyManager>
			<Favicon src={faviconDefault}/>
			<TabsAndRouter
				tabs={[
					{
						suffix: "/",
						text: "Assets",
						render: () => <TableExample/>,
						isDefault: true
					},
					{
						suffix: "/settings",
						text: "Settings",
						render: () => <SettingsPage/>
					}
				]}
			/>
			<ToastDisplay/>
		</GlobalHotkeyManager>
	)
}
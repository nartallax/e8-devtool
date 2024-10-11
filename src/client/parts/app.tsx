import {Form} from "client/components/form/form"
import {RootRoutingContextProvider} from "client/components/router/routing_context"
import {TabsAndRouter} from "client/components/tabs/tabs_and_router"
import {TitleProvider} from "client/components/title_context/title_context"
import {ToastProvider} from "client/components/toast/toast_context"
import {ToastDisplay} from "client/components/toast/toast_list"
import {UnsavedChangesProvider, useUnsavedChanges} from "client/components/unsaved_changes_context/unsaved_changes_context"
import {ApiProvider} from "client/parts/api_context"
import {GlobalHotkeyManager} from "client/parts/global_hotkeys/global_hotkey_manager"
import {TextureTreeProvider, useTextures} from "client/parts/texture_tree_context"
import {PropsWithChildren} from "react"
import faviconDefault from "../favicon.svg"
import faviconHasChanges from "../favicon_has_changes.svg"
import {Favicon} from "client/components/favicon/favicon"
import {HotkeyProvider} from "client/components/hotkey_context/hotkey_context"
import {ModalProviders} from "client/components/modal/modal_providers"
import {SettingsPage} from "client/parts/settings_page/settings_page"

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

/** API interactions providers */
const DataProviders = ({children}: PropsWithChildren) => (
	<ApiProvider>
		<TextureTreeProvider>
			{children}
		</TextureTreeProvider>
	</ApiProvider>
)

/** App-specific providers that are not directly related to API interaction process */
const AppProviders = ({children}: PropsWithChildren) => {
	return (
		<UnsavedChangesProvider preventUnsavedClose>
			<RootRoutingContextProvider>
				{children}
			</RootRoutingContextProvider>
		</UnsavedChangesProvider>
	)
}

const Providers = ({children}: PropsWithChildren) => (
	<CommonProviders>
		<DataProviders>
			<AppProviders>
				{children}
			</AppProviders>
		</DataProviders>
	</CommonProviders>
)

const Content = () => {
	const {isLoaded: isTexturesLoaded} = useTextures()
	const isEverythingLoaded = isTexturesLoaded
	const {hasChanges} = useUnsavedChanges()

	if(!isEverythingLoaded){
		return null
	}

	const favicon = hasChanges ? faviconHasChanges : faviconDefault

	return (
		<GlobalHotkeyManager>
			<Favicon src={favicon}/>
			<TabsAndRouter
				tabs={[
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
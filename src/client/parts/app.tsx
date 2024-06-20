import {Form} from "client/components/form/form"
import {HotkeyContextProvider} from "client/components/hotkey_context/hotkey_context"
import {AlertModalProvider} from "client/components/modal/alert_modal"
import {ChoiceModalProvider} from "client/components/modal/choice_modal"
import {RootRoutingContextProvider} from "client/components/router/routing_context"
import {TabsAndRouter} from "client/components/tabs/tabs_and_router"
import {ToastProvider} from "client/components/toast/toast_context"
import {ToastDisplay} from "client/components/toast/toast_list"
import {UnsavedChangesProvider, useUnsavedChanges} from "client/components/unsaved_changes_context/unsaved_changes_context"
import {ApiProvider} from "client/parts/api_context"
import {AtlasPage} from "client/parts/atlas_page/atlas_page"
import {ConfigProvider, useConfigContext} from "client/parts/config_context"
import {GlobalHotkeyManager} from "client/parts/global_hotkeys/global_hotkey_manager"
import {useSave} from "client/parts/global_hotkeys/use_save"
import {InputBindPage} from "client/parts/input_bind_page/input_bind_page"
import {ModelPage} from "client/parts/model_page/model_page"
import {ProjectProvider, useProjectContext} from "client/parts/project_context"
import {TextureTreeProvider, useTextures} from "client/parts/texture_tree_context"
import {PropsWithChildren, useEffect} from "react"

export const App = () => (
	<Providers>
		<Content/>
	</Providers>
)

/** Not app-specific providers */
const CommonProviders = ({children}: PropsWithChildren) => (
	<ToastProvider>
		<HotkeyContextProvider>
			<AlertModalProvider>
				<ChoiceModalProvider>
					<Form>
						{children}
					</Form>
				</ChoiceModalProvider>
			</AlertModalProvider>
		</HotkeyContextProvider>
	</ToastProvider>
)

/** API interactions providers */
const DataProviders = ({children}: PropsWithChildren) => (
	<ApiProvider>
		<TextureTreeProvider>
			<ProjectProvider>
				<ConfigProvider>
					{children}
				</ConfigProvider>
			</ProjectProvider>
		</TextureTreeProvider>
	</ApiProvider>
)

/** App-specific providers that are not directly related to API interaction process */
const AppProviders = ({children}: PropsWithChildren) => {
	const save = useSave()
	return (
		<UnsavedChangesProvider onSave={save} preventUnsavedClose>
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
	const {isLoaded: isProjectLoaded} = useProjectContext()
	const {isLoaded: isConfigLoaded} = useConfigContext()
	const isEverythingLoaded = isTexturesLoaded && isProjectLoaded && isConfigLoaded
	const {clearUnsavedFlag} = useUnsavedChanges()

	useEffect(() => {
		if(isEverythingLoaded){
			clearUnsavedFlag()
		}
	}, [isEverythingLoaded, clearUnsavedFlag])

	if(!isEverythingLoaded){
		return null
	}

	return (
		<>
			<GlobalHotkeyManager/>
			<TabsAndRouter
				tabs={[
					{
						suffix: "/models",
						text: "Models",
						isDefault: true,
						render: () => <ModelPage/>
					},
					{
						suffix: "/inputs",
						text: "Inputs",
						render: () => <InputBindPage/>
					},
					{
						suffix: "/atlas",
						text: "Atlas",
						render: () => <AtlasPage/>
					}
				]}
			/>
			<ToastDisplay/>
		</>
	)
}
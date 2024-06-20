import {Form} from "client/components/form/form"
import {HotkeyContextProvider} from "client/components/hotkey_context/hotkey_context"
import {AlertModalProvider} from "client/components/modal/alert_modal"
import {RootRoutingContextProvider} from "client/components/router/routing_context"
import {TabsAndRouter} from "client/components/tabs/tabs_and_router"
import {ToastProvider} from "client/components/toast/toast_context"
import {ToastDisplay} from "client/components/toast/toast_list"
import {ApiProvider} from "client/parts/api_context"
import {AtlasPage} from "client/parts/atlas_page/atlas_page"
import {ConfigProvider, useConfigContext} from "client/parts/config_context"
import {GlobalHotkeyManager} from "client/parts/global_hotkey_manager"
import {InputBindPage} from "client/parts/input_bind_page/input_bind_page"
import {ModelPage} from "client/parts/model_page/model_page"
import {ProjectProvider, useProjectContext} from "client/parts/project_context"
import {TextureTreeProvider, useTextures} from "client/parts/texture_tree_context"
import {PropsWithChildren} from "react"

export const App = () => {
	return (
		<Providers>
			<Content/>
		</Providers>
	)
}

const Providers = ({children}: PropsWithChildren) => (
	<ToastProvider>
		<HotkeyContextProvider>
			<AlertModalProvider>
				<ApiProvider>
					<RootRoutingContextProvider>
						<TextureTreeProvider>
							<ProjectProvider>
								<ConfigProvider>
									<Form>
										{children}
									</Form>
								</ConfigProvider>
							</ProjectProvider>
						</TextureTreeProvider>
					</RootRoutingContextProvider>
				</ApiProvider>
			</AlertModalProvider>
		</HotkeyContextProvider>
	</ToastProvider>
)

const Content = () => {
	const {isLoaded: isTexturesLoaded} = useTextures()
	const {isLoaded: isProjectLoaded} = useProjectContext()
	const {isLoaded: isConfigLoaded} = useConfigContext()

	if(!isTexturesLoaded || !isProjectLoaded || !isConfigLoaded){
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
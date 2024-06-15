import {Form} from "client/components/form/form"
import {HotkeyContextProvider} from "client/components/hotkey_context/hotkey_context"
import {RootRoutingContextProvider} from "client/components/router/routing_context"
import {TabsAndRouter} from "client/components/tabs/tabs_and_router"
import {ApiProvider} from "client/parts/api_context"
import {AtlasPage} from "client/parts/atlas_page/atlas_page"
import {ConfigProvider} from "client/parts/config_context"
import {GlobalHotkeyManager} from "client/parts/global_hotkey_manager"
import {InputBindPage} from "client/parts/input_bind_page/input_bind_page"
import {ModelPage} from "client/parts/model_page/model_page"
import {ProjectProvider} from "client/parts/project_context"
import {TextureTreeProvider} from "client/parts/texture_tree_context"

export const App = () => {
	return (
		// TODO: don't show anything, or show spinner, until all the data is loaded
		<HotkeyContextProvider>
			<ApiProvider>
				<RootRoutingContextProvider>
					<TextureTreeProvider>
						<ProjectProvider>
							<ConfigProvider>
								<Form>
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
								</Form>
							</ConfigProvider>
						</ProjectProvider>
					</TextureTreeProvider>
				</RootRoutingContextProvider>
			</ApiProvider>
		</HotkeyContextProvider>
	)
}
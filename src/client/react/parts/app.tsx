import {Form} from "client/react/components/form/form"
import {HotkeyContextProvider} from "client/react/components/hotkeyContext/hotkeyContext"
import {preventUndoRedoGlobally} from "client/react/components/hotkeyContext/hotkeyUtils"
import {RoutingContextProvider} from "client/react/components/router/routingContext"
import {TabsAndRouter} from "client/react/components/tabs/tabsAndRouter"
import {ApiProvider} from "client/react/parts/apiContext"
import {AtlasPage} from "client/react/parts/atlasPage/atlasPage"
import {ConfigProvider} from "client/react/parts/configContext"
import {InputBindPage} from "client/react/parts/inputBindPage/inputBindPage"
import {ModelPage} from "client/react/parts/modelPage/modelPage"
import {ProjectProvider} from "client/react/parts/projectContext"
import {TextureTreeProvider} from "client/react/parts/textureTreeContext"

export const App = () => {
	// we use custom hotkeys for undo/redo, and native undo/redo sometimes gets in the way
	// TODO: think about making this a hook...? and use it in places where custom undo/redo is defined
	preventUndoRedoGlobally()

	return (
		<HotkeyContextProvider>
			<ApiProvider>
				<RoutingContextProvider>
					<TextureTreeProvider>
						<ProjectProvider>
							<ConfigProvider>
								<Form>
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
				</RoutingContextProvider>
			</ApiProvider>
		</HotkeyContextProvider>
	)
}
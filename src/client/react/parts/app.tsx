import {HotkeyContextProvider} from "client/react/components/hotkeyContext/hotkeyContext"
import {RoutingContextProvider} from "client/react/components/router/routingContext"
import {TabsAndRouter} from "client/react/components/tabs/tabsAndRouter"
import {ApiProvider} from "client/react/parts/apiContext"
import {LayerPage} from "client/react/parts/layerPage/layerPage"
import {ModelPage} from "client/react/parts/modelPage/modelPage"
import {ProjectProvider} from "client/react/parts/projectContext"
import {TextureTreeProvider} from "client/react/parts/textureTreeContext"

export const App = () => {
	return (
		<HotkeyContextProvider>
			<ApiProvider>
				<RoutingContextProvider>
					<TextureTreeProvider>
						<ProjectProvider>
							<TabsAndRouter
								tabs={[
									{suffix: "/models", text: "Models", isDefault: true},
									{suffix: "/layers", text: "Layers"}
								]}
								routes={[
									["/models", () => <ModelPage/>],
									["/layers", () => <LayerPage/>]
								]}/>
						</ProjectProvider>
					</TextureTreeProvider>
				</RoutingContextProvider>
			</ApiProvider>
		</HotkeyContextProvider>
	)
}
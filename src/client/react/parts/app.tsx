import {HotkeyContextProvider} from "client/react/components/hotkeyContext/hotkeyContext"
import {RoutingContextProvider} from "client/react/components/router/routingContext"
import {TabsAndRouter} from "client/react/components/tabs/tabsAndRouter"
import {ApiProvider} from "client/react/parts/apiContext"
import {CollisionGroupPage} from "client/react/parts/collisionGroupPage/collisionGroupPage"
import {InputBindPage} from "client/react/parts/inputBindPage/inputBindPage"
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
									{
										suffix: "/models",
										text: "Models",
										isDefault: true,
										render: () => <ModelPage/>
									},
									{
										suffix: "/layers",
										text: "Layers",
										render: () => <LayerPage/>
									},
									{
										suffix: "/collision_groups",
										text: "Collisions",
										render: () => <CollisionGroupPage/>
									},
									{
										suffix: "/inputs",
										text: "Inputs",
										render: () => <InputBindPage/>
									}
								]}/>
						</ProjectProvider>
					</TextureTreeProvider>
				</RoutingContextProvider>
			</ApiProvider>
		</HotkeyContextProvider>
	)
}
import {useApi} from "client/parts/api_context"
import {defineContext} from "client/ui_utils/define_context"
import {ConfigFile, makeEmptyConfigFile} from "server/config"


const [_ConfigProvider, _useConfigContext] = defineContext({
	name: "ConfigContext",
	useValue: () => {
		const [config,,{isLoaded}] = useApi(makeEmptyConfigFile(), api => api.getConfigFile(), [])
		return {config, isLoaded}
	}
})
export const ConfigProvider = _ConfigProvider
export const useConfigContext = _useConfigContext

export const useConfig = (): ConfigFile => {
	return _useConfigContext().config
}
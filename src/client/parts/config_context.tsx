import {useApi} from "client/parts/api_context"
import {defineContext} from "client/ui_utils/define_context"
import {ConfigFile, makeEmptyConfigFile} from "server/config"


const [_ConfigProvider, useConfigContext] = defineContext({
	name: "ConfigContext",
	useValue: () => {
		const [config] = useApi(makeEmptyConfigFile(), api => api.getConfigFile(), [])
		return {config}
	}
})
export const ConfigProvider = _ConfigProvider


export const useConfig = (): ConfigFile => {
	return useConfigContext().config
}
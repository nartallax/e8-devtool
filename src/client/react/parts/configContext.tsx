import {useApi} from "client/react/parts/apiContext"
import {PropsWithChildren, createContext, useContext} from "react"
import {ConfigFile, makeEmptyConfigFile} from "server/config"


const configContextDefault = {
	config: makeEmptyConfigFile()
}

const ConfigContext = createContext(configContextDefault)

export const ConfigProvider = ({children}: PropsWithChildren) => {
	const [config] = useApi(makeEmptyConfigFile(), api => api.getConfigFile(), [])

	return <ConfigContext.Provider value={{config}}>{children}</ConfigContext.Provider>
}

export const useConfig = (): ConfigFile => {
	return useContext(ConfigContext).config
}
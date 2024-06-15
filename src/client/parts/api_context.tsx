import {XY} from "@nartallax/e8"
import {SetState} from "client/ui_utils/react_types"
import {ApiClient} from "common/api_client_base"
import {Tree} from "common/tree"
import {NamedId, Project, TextureFile} from "data/project"
import {SvgTextureFile} from "data/project_to_resourcepack/atlas_building_utils"
import {PropsWithChildren, createContext, useContext, useEffect, useRef, useState} from "react"
import {ConfigFile} from "server/config"

// TODO: why TF we have two API clients
class DevtoolApiClient extends ApiClient {
	constructor() {
		super("/api/", "POST")
	}

	getProject = () => this.call<Project>({name: "getProject"})
	saveAndProduce = (project: Project) => this.call({name: "saveAndProduce", body: [project]})
	getTextureFiles = () => this.call<Tree<TextureFile, NamedId>[]>({name: "getTextureFiles"})
	getTextureUrl = (texturePath: string) => "/textures/" + texturePath
	projectToAtlasLayout = (project: Project) => this.call<(SvgTextureFile & XY)[]>({name: "projectToAtlasLayout", body: [project]})
	getConfigFile = () => this.call<ConfigFile>({name: "getConfigFile"})
	getEntityTree = () => this.call<Tree<string, string>[]>({name: "getEntityTree"})
}

const apiContextDefault = {
	client: new DevtoolApiClient()
}

const ApiContext = createContext(apiContextDefault)

export const ApiProvider = ({children}: PropsWithChildren) => {
	const client = useRef(new DevtoolApiClient()).current

	return <ApiContext.Provider value={{client}}>{children}</ApiContext.Provider>
}

export function useApi<T, D>(defaultValue: D, caller: (api: DevtoolApiClient) => Promise<T>, deps: unknown[]): [T | D, SetState<T | D>]
export function useApi<T>(caller: (api: DevtoolApiClient) => Promise<T>, deps: unknown[]): [T | null, SetState<T | null>]
export function useApi(...args: unknown[]): [unknown, SetState<unknown>] {
	const defaultValue = args.length === 2 ? null : args[0]
	const caller = (args.length === 2 ? args[0] : args[1]) as (api: DevtoolApiClient) => Promise<unknown>
	const deps = (args.length === 2 ? args[1] : args[2]) as unknown[]

	const [result, setResult] = useState<unknown>(defaultValue)
	const {client} = useContext(ApiContext)

	useEffect(() => {
		caller(client).then(
			callResult => setResult(callResult),
			error => {
				console.error(error)
				// FIXME: toaster here?
			}
		)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, deps)

	return [result, setResult]
}
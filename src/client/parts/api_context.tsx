import {XY} from "@nartallax/e8"
import {useToastContext} from "client/components/toast/toast_context"
import {defineContext} from "client/ui_utils/define_context"
import {SetState} from "client/ui_utils/react_types"
import {ApiClient} from "common/api_client_base"
import {ApiError} from "common/api_response"
import {Tree} from "common/tree"
import {getRandomUUID} from "common/uuid"
import {NamedId, Project} from "data/project"
import {SvgTextureFile} from "data/project_to_resourcepack/atlas_building_utils"
import {Icon} from "generated/icons"
import {useEffect, useMemo, useState} from "react"

class DevtoolApiClient extends ApiClient {
	constructor(onApiError?: (error: ApiError) => void) {
		super("/api/", "POST", onApiError)
	}

	getProject = () => this.call<Project>({name: "getProject"})
	saveAndProduce = (project: Project) => this.call({name: "saveAndProduce", body: [project]})
	getTextureFiles = () => this.call<Tree<string, string>[]>({name: "getTextureFiles"})
	getTextureUrl = (texturePath: string) => "/textures/" + texturePath
	projectToAtlasLayout = (project: Project) => this.call<(SvgTextureFile & XY)[]>({name: "projectToAtlasLayout", body: [project]})
	getEntityTree = () => this.call<Tree<string, string>[]>({name: "getEntityTree"})
	getProjectRootForest = () => this.call<Tree<NamedId, NamedId>[]>({name: "getProjectRootForest"})
}

const apiErrorToastId = getRandomUUID()

const [_ApiProvider, useApiContext] = defineContext({
	name: "ApiContext",
	useValue: () => {
	  const {addToast} = useToastContext()
		const client = useMemo(() => {
			return new DevtoolApiClient(error => {
				addToast({
					icon: Icon.exclamationTriangle,
					text: error.message,
					ttl: 10000,
					id: apiErrorToastId
				})
			})
		}, [addToast])
		return {client}
	}
})
export const ApiProvider = _ApiProvider

type MiscUseApiResult = {
	isLoaded: boolean
	isError: boolean
}

export function useApi<T, D>(defaultValue: D, caller: (api: DevtoolApiClient) => Promise<T>, deps: unknown[]): [T | D, SetState<T | D>, MiscUseApiResult]
export function useApi<T>(caller: (api: DevtoolApiClient) => Promise<T>, deps: unknown[]): [T | null, SetState<T | null>, MiscUseApiResult]
export function useApi(...args: unknown[]): [unknown, SetState<unknown>, MiscUseApiResult] {
	const defaultValue = args.length === 2 ? null : args[0]
	const caller = (args.length === 2 ? args[0] : args[1]) as (api: DevtoolApiClient) => Promise<unknown>
	const deps = (args.length === 2 ? args[1] : args[2]) as unknown[]

	const [result, setResult] = useState<unknown>(defaultValue)
	const [miscResult, setMiscResult] = useState<MiscUseApiResult>({isLoaded: false, isError: false})
	const {client} = useApiContext()

	useEffect(() => {
		caller(client).then(
			callResult => {
				setResult(callResult)
				setMiscResult({isLoaded: true, isError: false})
			},
			error => {
				setMiscResult({isLoaded: true, isError: true})
				console.error(error)
				// FIXME: toaster here?
			}
		)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, deps)

	return [result, setResult, miscResult]
}

export const useApiClient = (): DevtoolApiClient => {
	return useApiContext().client
}
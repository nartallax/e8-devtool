import {XY} from "@nartallax/e8"
import {Tree} from "@nartallax/forest"
import {useToastContext} from "client/components/toast/toast_context"
import {defineContext} from "client/ui_utils/define_context"
import {SetState} from "client/ui_utils/react_types"
import {ApiClient} from "common/api_client_base"
import {ApiError} from "common/api_response"
import {errToString} from "common/err_to_string"
import {UUID, getRandomUUID} from "common/uuid"
import {ProjectCollisionGroup, ProjectConfig, ProjectInputBind, ProjectInputGroup, ProjectLayer, ProjectModel, ProjectParticle} from "data/project"
import {SvgTextureFile} from "data/project_to_resourcepack/atlas_building_utils"
import {Icon} from "generated/icons"
import {useEffect, useMemo, useState} from "react"

export type ForestApiBindings<T> = {
	create: (relPath: string, index: number, value: T) => Promise<void>
	update: (item: T) => Promise<void>
	createDirectory: (relPath: string, index: number) => Promise<void>
	move: (fromRelPath: string, toRelPath: string, index: number) => Promise<void>
	rename: (oldRelPath: string, newName: string) => Promise<void>
	delete: (relPath: string) => Promise<void>
	getPathsByFieldValue: <K extends keyof T>(field: K, value: T[K]) => Promise<string[]>
	getAll: () => Promise<Record<string, T>>
	getPathById: (id: UUID) => Promise<string>
	get: (id: UUID) => Promise<T>
	getByPath: (path: string) => Promise<T>
	getForest: () => Promise<Tree<string, string>[]>
}

export class DevtoolApiClient extends ApiClient {
	constructor(onApiError?: (error: ApiError) => void) {
		super("/api/batch", "POST", "raf", onApiError)
	}

	private makeForestBindings<T>(prefix: string): ForestApiBindings<T> {
		return {
			create: (...args) => this.call({name: `${prefix}/create`, body: args}),
			update: (...args) => this.call({name: `${prefix}/update`, body: args}),
			createDirectory: (...args) => this.call({name: `${prefix}/createDirectory`, body: args}),
			move: (...args) => this.call({name: `${prefix}/move`, body: args}),
			rename: (...args) => this.call({name: `${prefix}/rename`, body: args}),
			delete: (...args) => this.call({name: `${prefix}/delete`, body: args}),
			getPathsByFieldValue: (...args) => this.call({name: `${prefix}/getPathsByFieldValue`, body: args}),
			getAll: () => this.call({name: `${prefix}/getAll`}),
			getPathById: (...args) => this.call({name: `${prefix}/getPathById`, body: args}),
			get: (...args) => this.call({name: `${prefix}/get`, body: args}),
			getByPath: (...args) => this.call({name: `${prefix}/getByPath`, body: args}),
			getForest: () => this.call({name: `${prefix}/getForest`})
		}
	}

	generateResourcePack = () => this.call({name: "generateResourcePack"})
	getTextureFiles = () => this.call<Tree<string, string>[]>({name: "getTextureFiles"})
	getTextureUrl = (texturePath: string) => "/textures/" + texturePath
	getAtlasLayout = () => this.call<(SvgTextureFile & XY)[]>({name: "getAtlasLayout"})
	getProjectRootForest = () => this.call<Tree<string, string>[]>({name: "getProjectRootForest"})

	getProjectConfig = () => this.call<ProjectConfig>({name: "getProjectConfig"})
	updateProjectConfig = (config: ProjectConfig) => this.call<void>({name: "updateProjectConfig", body: [config]})

	getCollisionPairs = () => this.call<[UUID, UUID][]>({name: "getCollisionPairs"})
	updateCollisionPairs = (pairs: [UUID, UUID][]) => this.call<void>({name: "updateCollisionPairs", body: [pairs]})

	forestBindings = {
		model: this.makeForestBindings<ProjectModel>("model"),
		particle: this.makeForestBindings<ProjectParticle>("particle"),
		collisionGroup: this.makeForestBindings<ProjectCollisionGroup>("collisionGroup"),
		layer: this.makeForestBindings<ProjectLayer>("layer"),
		inputGroup: this.makeForestBindings<ProjectInputGroup>("inputGroup"),
		inputBind: this.makeForestBindings<ProjectInputBind>("inputBind")
	}
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

type MiscAsyncResult = {
	isLoaded: boolean
	isError: boolean
}

export function useApi<T, D>(defaultValue: D, caller: (api: DevtoolApiClient) => Promise<T>, deps: unknown[]): [T | D, SetState<T | D>, MiscAsyncResult]
export function useApi<T>(caller: (api: DevtoolApiClient) => Promise<T>, deps: unknown[]): [T | null, SetState<T | null>, MiscAsyncResult]
export function useApi(...args: unknown[]): [unknown, SetState<unknown>, MiscAsyncResult] {
	const defaultValue = args.length === 2 ? null : args[0]
	const caller = (args.length === 2 ? args[0] : args[1]) as (api: DevtoolApiClient) => Promise<unknown>
	const deps = (args.length === 2 ? args[1] : args[2]) as unknown[]
	const {client} = useApiContext()

	return useAsyncCall(defaultValue, () => caller(client), deps)
}

export const useApiClient = (): DevtoolApiClient => {
	return useApiContext().client
}

export function useAsyncCall<T, D = T>(defaultValue: D, caller: () => Promise<T>, deps: unknown[]): [T | D, SetState<T | D>, MiscAsyncResult]
export function useAsyncCall<T>(caller: () => Promise<T>, deps: unknown[]): [T | null, SetState<T | null>, MiscAsyncResult]
export function useAsyncCall(...args: unknown[]): [unknown, SetState<unknown>, MiscAsyncResult] {
	const defaultValue = args.length === 2 ? null : args[0]
	const caller = (args.length === 2 ? args[0] : args[1]) as () => Promise<unknown>
	const deps = (args.length === 2 ? args[1] : args[2]) as unknown[]

	const [result, setResult] = useState<unknown>(defaultValue)
	const [miscResult, setMiscResult] = useState<MiscAsyncResult>({isLoaded: false, isError: false})

	useEffect(() => {
		caller().then(
			callResult => {
				setResult(callResult)
				setMiscResult({isLoaded: true, isError: false})
			},
			(error: unknown) => {
				setMiscResult({isLoaded: true, isError: true})
				console.error(errToString(error))
				// FIXME: toaster here?
			}
		)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, deps)

	return [result, setResult, miscResult]
}
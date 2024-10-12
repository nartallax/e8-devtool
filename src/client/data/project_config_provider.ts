import {useApiClient} from "client/parts/api_context"
import {useQuery} from "client/ui_utils/cacheable_query"
import {makeBlankProjectConfig} from "data/project"

export const useConfig = () => {
	const api = useApiClient()
	return useQuery({
		keys: ["projectConfig"],
		fetch: () => api.getProjectConfig(),
		default: makeBlankProjectConfig(),
		save: config => api.updateProjectConfig(config)
	})
}
import {useApiClient} from "client/parts/api_context"
import {Query, useQuery} from "client/ui_utils/cacheable_query"
import {ProjectObjectToType, ProjectObjectType, emptyProjectObjectMakers} from "data/project_object_types"

export const useProjectObject = <T extends ProjectObjectType>(path: string, type: T): Query<ProjectObjectToType[T]> => {
	const api = useApiClient()
	return useQuery({
		keys: [type, path],
		default: emptyProjectObjectMakers[type](),
		fetch: () => api.fsBindings.get(path) as Promise<ProjectObjectToType[T]>,
		save: value => api.fsBindings.update(path, value)
	})
}
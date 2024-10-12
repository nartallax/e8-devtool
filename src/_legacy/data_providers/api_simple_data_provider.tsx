import {UnsavedChanges} from "client/components/unsaved_changes_context/unsaved_changes_context"
import {useWrapSaveableState} from "client/components/unsaved_changes_context/use_saveable_state"
import {DevtoolApiClient, useApiClient, useAsyncCall} from "client/parts/api_context"
import {makeQueryGroup} from "client/ui_utils/cacheable_query"
import {SetState} from "client/ui_utils/react_types"

type UseEditableDataResult<T> = {
	value: T
	setValue: SetState<T>
	save: () => Promise<void>
	changesProps: React.ComponentProps<typeof UnsavedChanges>
}

type ApiSaveableData<T> = {
	useEditableData: () => UseEditableDataResult<T> | null
	useData: () => T | null
}

export function makeApiSimpleDataProvider<T>(name: string, load: (api: DevtoolApiClient) => Promise<T>, save: (api: DevtoolApiClient, value: T) => Promise<void>): ApiSaveableData<T> {

	function useQueries() {
		const apiClient = useApiClient()
		return makeQueryGroup([name], ({query, mutation}) => ({
			load: query(() => load(apiClient)),
			update: mutation((value: T) => save(apiClient, value))
		}))
	}

	function useEditableData() {
		const queries = useQueries()
		const [rawValue, rawSetValue] = useAsyncCall(() => queries.load.getValue(), [])
		const {
			isUnsaved, setState, save, state
		} = useWrapSaveableState(rawValue, rawSetValue, async(value: T | null) => {
			if(value !== null){
				await queries.update(value)
			}
		})

		if(!state){
			return null
		}

		const result: UseEditableDataResult<T> = {
			value: state,
			setValue: setState as SetState<T>,
			save,
			changesProps: {
				save,
				isUnsaved: isUnsaved
			}
		}

		return result
	}

	function useData() {
		return useQueries().load.useValue()
	}


	return {useEditableData, useData}
}
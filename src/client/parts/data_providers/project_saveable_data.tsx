import {UnsavedChanges} from "client/components/unsaved_changes_context/unsaved_changes_context"
import {useSaveableState} from "client/components/unsaved_changes_context/use_saveable_state"
import {useProject} from "client/parts/project_context"
import {SetState} from "client/ui_utils/react_types"
import {Project} from "data/project"

type UseEditableDataResult<T> = {
	value: T
	setValue: SetState<T>
	save: () => Promise<void>
	changesProps: React.ComponentProps<typeof UnsavedChanges>
}

type ProjectSaveableData<T> = {
	useEditableData: () => UseEditableDataResult<T> | null
	useData: () => T | null
}

export function makeProjectSaveableDataWrapper<T>(propName: keyof Project): ProjectSaveableData<T> {
	function useEditableData() {
		const [project, setProject] = useProject()
		const {
			isUnsaved, setState, save, state
		} = useSaveableState(
			project[propName] as T,
			value => setProject(project => ({
				...project,
				[propName]: value
			})))

		const result: UseEditableDataResult<T> = {
			value: state,
			setValue: setState,
			save,
			changesProps: {
				saveOnUnmount: true,
				save,
				isUnsaved: isUnsaved
			}
		}

		return result
	}

	function useData() {
		const [project] = useProject()
		return project[propName] as T
	}


	return {useEditableData, useData}
}
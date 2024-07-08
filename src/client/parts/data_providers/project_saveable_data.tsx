import {UnsavedChanges} from "client/components/unsaved_changes_context/unsaved_changes_context"
import {useSaveableState} from "client/components/unsaved_changes_context/use_saveable_state"
import {useProject} from "client/parts/project_context"
import {SetState} from "client/ui_utils/react_types"
import {Project} from "data/project"

type ProjectSaveableDataAddedProps<T> = {
	value: T
	setValue: SetState<T>
}

export function makeProjectSaveableDataWrapper<T>(propName: keyof Project) {
	return function withProjectSaveableData<P extends object>(Component: React.FC<P & ProjectSaveableDataAddedProps<T>>) {
		return function WrapperComponent(props: P) {
			const [project, setProject] = useProject()
			const {
				isUnsaved, setState, save, state
			} = useSaveableState(
				project[propName] as T,
				value => setProject(project => ({
					...project,
					[propName]: value
				})))

			return (
				<UnsavedChanges isUnsaved={isUnsaved} saveOnUnmount save={save}>
					<Component
						{...props}
						value={state}
						setValue={setState}
					/>
				</UnsavedChanges>
			)
		}
	}
}
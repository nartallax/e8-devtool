import {useUnsavedChanges} from "client/components/unsaved_changes_context/unsaved_changes_context"
import {useApi} from "client/parts/api_context"
import {defineContext} from "client/ui_utils/define_context"
import {SetState} from "client/ui_utils/react_types"
import {useWrappedSetState} from "client/ui_utils/use_wrapped_setstate"
import {Project, makeBlankProject} from "data/project"

export const [ProjectProvider, useProjectContext] = defineContext({
	name: "ProjectContext",
	useValue: () => {
		const [project, setProject, {isLoaded}] = useApi(makeBlankProject(), api => api.getProject(), [])
		return {project, setProject, isLoaded}
	}
})

export const useProject = (): [Project, SetState<Project>] => {
	const {project, setProject} = useProjectContext()
	const {notifyHasUnsavedChanges} = useUnsavedChanges()
	const wrappedSetProject = useWrappedSetState(setProject, {before: notifyHasUnsavedChanges})
	return [project, wrappedSetProject]
}
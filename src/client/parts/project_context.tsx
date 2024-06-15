import {useApi} from "client/parts/api_context"
import {defineContext} from "client/ui_utils/define_context"
import {SetState} from "client/ui_utils/react_types"
import {Project, makeBlankProject} from "data/project"

export const [ProjectProvider, useProjectContext] = defineContext({
	name: "ProjectContext",
	useValue: () => {
		const [project, setProject, isLoaded] = useApi(makeBlankProject(), api => api.getProject(), [])
		return {project, setProject, isLoaded}
	}
})

export const useProject = (): [Project, SetState<Project>] => {
	const {project, setProject} = useProjectContext()
	return [project, setProject]
}
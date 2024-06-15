import {useApi} from "client/parts/api_context"
import {defineContext} from "client/ui_utils/define_context"
import {SetState} from "client/ui_utils/react_types"
import {Project, makeBlankProject} from "data/project"
import {useState} from "react"

export const [ProjectProvider, useProjectContext] = defineContext({
	name: "ProjectContext",
	useValue: () => {
		const [isLoaded, setLoaded] = useState(false)
		const [project, setProject] = useApi(makeBlankProject(), async api => {
			const result = await api.getProject()
			setLoaded(true)
			return result
		}, [])
		return {project, setProject, isLoaded}
	}
})

export const useProject = (): [Project, SetState<Project>] => {
	const {project, setProject} = useProjectContext()
	return [project, setProject]
}
import {useApi} from "client/parts/api_context"
import {SetState} from "client/ui_utils/react_types"
import {Project, makeBlankProject} from "data/project"
import {PropsWithChildren, createContext, useContext, useState} from "react"

// TODO: for all contexts, default should be null, typecasted to a type
// and custom useContext hooks should check for null and throw
// (maybe this even should be a helper function...?)
const projectContextDefault = {
	project: makeBlankProject(),
	setProject: null as unknown as SetState<Project>,
	// TODO: remove this; this should be handled on app level
	isLoaded: false
}

const ProjectContext = createContext(projectContextDefault)

export const ProjectProvider = ({children}: PropsWithChildren) => {
	const [isLoaded, setLoaded] = useState(false)
	const [project, setProject] = useApi(makeBlankProject(), async api => {
		const result = await api.getProject()
		setLoaded(true)
		return result
	}, [])

	return (
		<ProjectContext.Provider value={{
			project, setProject, isLoaded
		}}>
			{children}
		</ProjectContext.Provider>
	)
}

export const useProject = (): [Project, SetState<Project>] => {
	const {project, setProject} = useContext(ProjectContext)
	return [project, setProject]
}

export const useProjectContext = (): typeof projectContextDefault => useContext(ProjectContext)
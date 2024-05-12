import {useApi} from "client/react/parts/apiContext"
import {SetState} from "client/react/uiUtils/setState"
import {Project, makeBlankProject} from "data/project"
import {PropsWithChildren, createContext, useContext} from "react"

const projectContextDefault = {
	project: makeBlankProject(),
	setProject: null as unknown as SetState<Project>
}

const ProjectContext = createContext(projectContextDefault)

export const ProjectProvider = ({children}: PropsWithChildren) => {
	const [project, setProject] = useApi(makeBlankProject(), api => api.getProject(), [])

	return (
		<ProjectContext.Provider value={{
			project, setProject
		}}>
			{children}
		</ProjectContext.Provider>
	)
}

export const useProject = (): [Project, SetState<Project>] => {
	const {project, setProject} = useContext(ProjectContext)
	return [project, setProject]
}
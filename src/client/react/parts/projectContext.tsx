import {useApi} from "client/react/parts/apiContext"
import {SetState} from "client/react/uiUtils/setState"
import {Project, makeBlankProject} from "data/project"
import {PropsWithChildren, createContext, useContext, useState} from "react"

const projectContextDefault = {
	project: makeBlankProject(),
	setProject: null as unknown as SetState<Project>,
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
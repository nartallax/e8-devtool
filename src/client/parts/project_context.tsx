import {useToastContext} from "client/components/toast/toast_context"
import {useSaveableState} from "client/components/unsaved_changes_context/use_saveable_state"
import {useApiClient} from "client/parts/api_context"
import {defineContext} from "client/ui_utils/define_context"
import {SetState} from "client/ui_utils/react_types"
import {getRandomUUID} from "common/uuid"
import {Project, makeBlankProject} from "data/project"
import {Icon} from "generated/icons"
import {useEffect, useState} from "react"

const savingToastId = getRandomUUID()

export const [ProjectProvider, useProjectContext] = defineContext({
	name: "ProjectContext",
	useValue: () => {
		const apiClient = useApiClient()
		const {addToast, updateToast, removeToast} = useToastContext()

		const {
			state: project, setState: setProject, isUnsaved, markSaved, save
		} = useSaveableState(
			makeBlankProject(), async project => {
				addToast({
					icon: Icon.spinner,
					text: "Saving...",
					id: savingToastId,
					isStepRotating: true
				})
				try {
					await apiClient.saveAndProduce(project)
				} catch(e){
					// if there was an error - it was api error and there's a toast already
					// so all that's left is to remove ours
					removeToast(savingToastId)
				}

				updateToast({
					id: savingToastId,
					text: "Saved!",
					icon: Icon.check,
					ttl: 1000,
					isStepRotating: false
				})
			}
		)

		const [isLoaded, setLoaded] = useState(false)
		useEffect(() => {
			void apiClient.getProject().then(project => {
				setProject(project)
				markSaved()
				setLoaded(true)
			})
		}, [apiClient, markSaved, setProject])

		return {
			project, setProject, isLoaded, isUnsaved, save
		}
	}
})

export const useProject = (): [Project, SetState<Project>] => {
	const {project, setProject} = useProjectContext()
	return [project, setProject]
}
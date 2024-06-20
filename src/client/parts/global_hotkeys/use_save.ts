import {useToastContext} from "client/components/toast/toast_context"
import {useApiClient} from "client/parts/api_context"
import {useProjectContext} from "client/parts/project_context"
import {getRandomUUID} from "common/uuid"
import {Project} from "data/project"
import {Icon} from "generated/icons"
import {useCallback} from "react"

const savingToastId = getRandomUUID()

/** Creates a function that saves current project when called, displaying toasts */
export const useSave = () => {

	const apiClient = useApiClient()
	const {setProject} = useProjectContext()
	const {addToast, updateToast} = useToastContext()

	return useCallback(async() => {
		let project: Project | null = null
		setProject(_project => {
			project = _project
			return _project
		})
		if(!project){
			throw new Error("wtf")
		}

		addToast({
			icon: Icon.spinner,
			text: "Saving...",
			id: savingToastId,
			isStepRotating: true
		})
		await apiClient.saveAndProduce(project)
		updateToast({
			id: savingToastId,
			text: "Saved!",
			icon: Icon.check,
			ttl: 1000,
			isStepRotating: false
		})
	}, [apiClient, addToast, updateToast, setProject])
}
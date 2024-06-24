import {useToastContext} from "client/components/toast/toast_context"
import {useApiClient} from "client/parts/api_context"
import {useProjectContext} from "client/parts/project_context"
import {getValueFromSetState} from "client/ui_utils/get_value_from_setstate"
import {getRandomUUID} from "common/uuid"
import {Icon} from "generated/icons"
import {useCallback} from "react"

const savingToastId = getRandomUUID()

/** Creates a function that saves current project when called, displaying toasts */
export const useSave = () => {

	const apiClient = useApiClient()
	const {setProject} = useProjectContext()
	const {addToast, updateToast} = useToastContext()

	return useCallback(async() => {
		const project = await getValueFromSetState(setProject)

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
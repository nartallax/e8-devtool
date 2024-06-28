import {Hotkey} from "client/components/hotkey_context/hotkey_context"
import {preventUndoRedoGlobally} from "client/components/hotkey_context/hotkey_utils"
import {useToastContext} from "client/components/toast/toast_context"
import {UnsavedChanges, useUnsavedChanges} from "client/components/unsaved_changes_context/unsaved_changes_context"
import {useRevision} from "client/components/unsaved_changes_context/use_revision"
import {useApiClient} from "client/parts/api_context"
import {useProject} from "client/parts/project_context"
import {getValueFromSetState} from "client/ui_utils/get_value_from_setstate"
import {getRandomUUID} from "common/uuid"
import {Icon} from "generated/icons"
import {PropsWithChildren, useCallback, useEffect} from "react"

// a component that manages hotkeys that fire globally on page
export const GlobalHotkeyManager = ({children}: PropsWithChildren) => {
	// we use custom hotkeys for undo/redo, and native undo/redo sometimes gets in the way
	// I was thinking about making this a hook, so components that have undo/redo hotkeys can disable it at will
	// and chose not to, because then native undo/redo will work in some places and won't work in others
	// which is inconsistent, and worse than not working at all
	useEffect(() => {
		preventUndoRedoGlobally()
	}, [])

	const [project] = useProject()
	const projectRevision = useRevision(project)
	const uploadProject = useUploadProject()
	const {save} = useUnsavedChanges()

	return (
		<UnsavedChanges revision={projectRevision} save={uploadProject}>
			<Hotkey
				shouldPick={e => e.code === "KeyS" && e.ctrlKey}
				onPress={e => {
					e.preventDefault()
					void save()
				}}>
				{children}
			</Hotkey>
		</UnsavedChanges>
	)
}

const savingToastId = getRandomUUID()

/** Creates a function that saves current project when called, displaying toasts */
export const useUploadProject = () => {

	const apiClient = useApiClient()
	const [, setProject] = useProject()
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
import {useHotkey} from "client/components/hotkey_context/hotkey_context"
import {preventUndoRedoGlobally} from "client/components/hotkey_context/hotkey_utils"
import {useToastContext} from "client/components/toast/toast_context"
import {useApiClient} from "client/parts/api_context"
import {useProject} from "client/parts/project_context"
import {getRandomUUID} from "common/uuid"
import {Icon} from "generated/icons"
import {useCallback, useRef} from "react"

const savingToastId = getRandomUUID()

// a component that manages hotkeys that fire globally on page
export const GlobalHotkeyManager = () => {
	// we use custom hotkeys for undo/redo, and native undo/redo sometimes gets in the way
	// I was thinking about making this a hook, so components that have undo/redo hotkeys can disable it at will
	// and chose not to, because then native undo/redo will work in some places and won't work in others
	// which is inconsistent, and worse than not working at all
	preventUndoRedoGlobally()

	const apiClient = useApiClient()
	const [project] = useProject()
	const {addToast, updateToast} = useToastContext()
	useHotkey({
		ref: useRef(document.body),
		shouldPick: useCallback((e: KeyboardEvent) => e.code === "KeyS" && e.ctrlKey, []),
		onPress: useCallback(async(e: KeyboardEvent) => {
			e.preventDefault()
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
		}, [project, apiClient, addToast, updateToast])
	})

	return null
}
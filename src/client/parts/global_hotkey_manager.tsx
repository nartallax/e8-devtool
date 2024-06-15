import {Api} from "client/api_client"
import {useHotkey} from "client/components/hotkey_context/hotkey_context"
import {preventUndoRedoGlobally} from "client/components/hotkey_context/hotkey_utils"
import {useProject} from "client/parts/project_context"
import {useCallback, useRef} from "react"

// a component that manages hotkeys that fire globally on page
export const GlobalHotkeyManager = () => {
	// we use custom hotkeys for undo/redo, and native undo/redo sometimes gets in the way
	// TODO: think about making this a hook...? and use it in places where custom undo/redo is defined
	preventUndoRedoGlobally()

	const [project] = useProject()
	useHotkey({
		ref: useRef(document.body),
		shouldPick: useCallback((e: KeyboardEvent) => e.code === "KeyS" && e.ctrlKey, []),
		onPress: useCallback(async(e: KeyboardEvent) => {
			e.preventDefault()
			// TODO: toast
			await Api.saveAndProduce(project)
			console.log("yay saved")
		}, [project])
	})

	return null
}
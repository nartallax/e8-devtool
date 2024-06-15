import {Api} from "client/api_client"
import {useHotkey} from "client/react/components/hotkeyContext/hotkeyContext"
import {preventUndoRedoGlobally} from "client/react/components/hotkeyContext/hotkeyUtils"
import {useProject} from "client/react/parts/projectContext"
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
			console.log(e)
			e.preventDefault()
			// TODO: toast
			await Api.saveAndProduce(project)
			console.log("yay saved!")
		}, [project])
	})

	return null
}
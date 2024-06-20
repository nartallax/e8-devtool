import {useHotkey} from "client/components/hotkey_context/hotkey_context"
import {preventUndoRedoGlobally} from "client/components/hotkey_context/hotkey_utils"
import {useSave} from "client/parts/global_hotkeys/use_save"
import {useEffect, useRef} from "react"

// a component that manages hotkeys that fire globally on page
export const GlobalHotkeyManager = () => {
	// we use custom hotkeys for undo/redo, and native undo/redo sometimes gets in the way
	// I was thinking about making this a hook, so components that have undo/redo hotkeys can disable it at will
	// and chose not to, because then native undo/redo will work in some places and won't work in others
	// which is inconsistent, and worse than not working at all
	useEffect(() => {
		preventUndoRedoGlobally()
	}, [])


	const save = useSave()
	useHotkey({
		ref: useRef(document.body),
		shouldPick: e => e.code === "KeyS" && e.ctrlKey,
		onPress: e => {
			e.preventDefault()
			void save()
		}
	})

	return null
}
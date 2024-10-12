import {Hotkey} from "client/components/hotkey_context/hotkey_context"
import {preventUndoRedoGlobally} from "client/components/hotkey_context/hotkey_utils"
import {useToastContext} from "client/components/toast/toast_context"
import {saveAllSaveableQueries} from "client/ui_utils/cacheable_query"
import {getRandomUUID} from "common/uuid"
import {Icon} from "generated/icons"
import {PropsWithChildren, useEffect} from "react"

const savingToastId = getRandomUUID()

// a component that manages hotkeys that fire globally on page
export const GlobalHotkeyManager = ({children}: PropsWithChildren) => {
	// we use custom hotkeys for undo/redo, and native undo/redo sometimes gets in the way
	// I was thinking about making this a hook, so components that have undo/redo hotkeys can disable it at will
	// and chose not to, because then native undo/redo will work in some places and won't work in others
	// which is inconsistent, and worse than not working at all
	useEffect(() => {
		preventUndoRedoGlobally()
	}, [])

	const {addToast, updateToast, removeToast} = useToastContext()

	return (
		<Hotkey
			shouldPick={e => e.code === "KeyS" && e.ctrlKey}
			onPress={async e => {
				e.preventDefault()

				addToast({
					icon: Icon.spinner,
					text: "Saving...",
					id: savingToastId,
					isStepRotating: true
				})

				try {
					await saveAllSaveableQueries()
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

			}}>
			{children}
		</Hotkey>
	)
}
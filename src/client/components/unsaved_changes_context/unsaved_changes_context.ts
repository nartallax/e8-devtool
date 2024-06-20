import {useChoiceModal} from "client/components/modal/choice_modal"
import {AbortError} from "client/ui_utils/abort_error"
import {defineContext} from "client/ui_utils/define_context"
import {useCallback, useEffect, useRef, useState} from "react"

type Props = {
	onSave: () => (Promise<void> | void)
	/** Adds handler to display "Are you sure" when user closes tab with unsaved changes */
	preventUnsavedClose?: boolean
}

const [_UnsavedChangesProvider, useUnsavedChangesContext] = defineContext({
	name: "UnsavedChangesContext",
	useValue: ({onSave, preventUnsavedClose}: Props) => {
		const [hasUnsaved, setHasUnsaved] = useState(false)
		const onSaveActions = useRef<(() => (Promise<void> | void))[]>([])

		const save = useCallback(async() => {
			const actions = onSaveActions.current
			await Promise.all(actions.map(action => Promise.resolve(action())))
			await onSave()
			setHasUnsaved(false)
		}, [onSave])

		useEffect(() => {
			if(!preventUnsavedClose || !hasUnsaved){
				// we are checking hasUnsaved here, because some browsers (chrome) trigger on the mere presence of onbeforeunload
				// regardless of what it actually does
				// so we need to clear it if we don't plan to actually prevent user from leaving
				return noop
			}

			const oldBeforeunload = window.onbeforeunload
			const newBeforeunload = (e: BeforeUnloadEvent) => {
				e.preventDefault()
				e.returnValue = true
				return true
			}

			// yes, this effect can only be achieved if event handler is assigned like this
			window.onbeforeunload = newBeforeunload
			return () => {
				if(window.onbeforeunload === newBeforeunload){
					window.onbeforeunload = oldBeforeunload
				} else {
					console.warn("Something re-assigned window.onbeforeunload. That's unexpected - <UnsavedChangesContext> uses this property, and nothing else should modify it.")
				}
			}
		}, [preventUnsavedClose, hasUnsaved])

		return {save, onSaveActions, hasUnsaved, setHasUnsaved}
	}
})
export const UnsavedChangesProvider = _UnsavedChangesProvider

type HookOptions = {
	onSave?: () => (Promise<void> | void)
}

type TrySaveOptions = {
	actionDescription?: string
}

const getTrySaveMessage = ({actionDescription}: TrySaveOptions = {}) => {
	return `We have unsaved changes that will be lost${actionDescription ? " if you " + actionDescription : ""}. Do you want to save them?`
}


const noop = () => {}
export const useUnsavedChanges = ({onSave}: HookOptions = {}) => {
	const {onSaveActions, hasUnsaved, setHasUnsaved, save} = useUnsavedChangesContext()
	const {showConfirmationModal} = useChoiceModal()

	useEffect(() => {
		if(!onSave){
			return noop
		}

		onSaveActions.current.push(onSave)
		return () => onSaveActions.current = onSaveActions.current.filter(x => x !== onSave)
	}, [onSave, onSaveActions])

	const notifyHasUnsavedChanges = useCallback(() => {
		setHasUnsaved(true)
	}, [setHasUnsaved])

	const clearUnsavedFlag = useCallback(() => {
		setHasUnsaved(false)
	}, [setHasUnsaved])

	/** If there are unsaved changes - ask user if they should be saved. If user refuses - throw AbortError; save otherwise. */
	const saveChangesOrAbort = useCallback(async(opts: TrySaveOptions) => {
		if(!hasUnsaved){
			return
		}

		if(!await showConfirmationModal({
			header: "Unsaved changes",
			body: getTrySaveMessage(opts)
		})){
			throw new AbortError("User don't want to save.")
		}

		await save()
	}, [hasUnsaved, showConfirmationModal, save])

	return {notifyHasUnsavedChanges, clearUnsavedFlag, save, saveChangesOrAbort, hasUnsaved}
}
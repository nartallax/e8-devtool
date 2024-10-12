import {useChoiceModal} from "client/components/modal/choice_modal"
import {AbortError} from "client/ui_utils/abort_error"
import {defineNestedTreeContext} from "client/ui_utils/define_nested_tree_context"
import {noop} from "client/ui_utils/noop"
import {useMemoObject} from "client/ui_utils/use_memo_object"
import {useCallback, useEffect, useRef} from "react"

type Props = {
	/** Adds handler to display "Are you sure" when user closes tab with unsaved changes */
	preventUnsavedClose?: boolean
}

type NestedProps = {
	isUnsaved: boolean
	save: () => void | Promise<void>
	alwaysRun?: boolean
	saveOnUnmount?: boolean
}

const {RootProvider: _UnsavedChangesProvider, NestedProvider: _UnsavedChanges, useRootContext: _useUnsavedChanges} = defineNestedTreeContext({
	name: "UnsavedChangesContext",

	useNestedValue: ({
		isUnsaved, save, alwaysRun = false, saveOnUnmount = false
	}: NestedProps) => {

		const saveRef = useRef(save)
		saveRef.current = save
		const saveCallback = useCallback(async() => {
			await Promise.resolve(saveRef.current())
		}, [])

		const saveOnUnmountRef = useRef(saveOnUnmount)
		saveOnUnmountRef.current = saveOnUnmount
		useEffect(() => () => {
			if(saveOnUnmountRef.current){
				void saveRef.current()
			}
		}, [])

		return useMemoObject({isUnsaved, save: saveCallback, alwaysRun})
	},

	useRootValue: ({preventUnsavedClose = false}: Props, treeServices) => {
		const treeRef = useRef(treeServices)
		treeRef.current = treeServices

		const save = useCallback(async() => {
			const savers = treeRef.current.getSortedByDepth()
			for(let i = savers.length - 1; i >= 0; i--){
				const {save, isUnsaved, alwaysRun} = savers[i]!
				if(isUnsaved || alwaysRun){
					await save()
				}
			}
		}, [])

		const hasChanges = treeServices.getSortedByDepth().some(child => child.isUnsaved)
		usePreventBrowserClose(hasChanges && preventUnsavedClose)

		const {showConfirmationModal} = useChoiceModal()
		/** If there are unsaved changes - ask user if they should be saved. If user refuses - throw AbortError; save otherwise. */
		const saveOrAbort = useCallback(async(opts: TrySaveOptions = {}) => {
			if(!hasChanges){
				return
			}

			if(!await showConfirmationModal({
				header: "Unsaved changes",
				body: getTrySaveMessage(opts)
			})){
				throw new AbortError("User don't want to save.")
			}

			await save()
		}, [hasChanges, showConfirmationModal, save])

		return {save, hasChanges, saveOrAbort}
	}
})

const usePreventBrowserClose = (isEnabled: boolean) => {
	useEffect(() => {
		if(!isEnabled){
			// because some browsers (chrome) trigger on the mere presence of onbeforeunload
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
				console.warn("Something re-assigned window.onbeforeunload. That's unexpected - UnsavedChangesContext uses this property, and nothing else should modify it.")
			}
		}
	}, [isEnabled])
}

type TrySaveOptions = {
	actionDescription?: string
}

const getTrySaveMessage = ({actionDescription}: TrySaveOptions = {}) => {
	return `We have unsaved changes that will be lost${actionDescription ? " if you " + actionDescription : ""}. Do you want to save them?`
}

export const UnsavedChangesProvider = _UnsavedChangesProvider
export const UnsavedChanges = _UnsavedChanges
export const useUnsavedChanges = () => _useUnsavedChanges().value
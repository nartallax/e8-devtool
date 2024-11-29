import {defineNestedTreeContext} from "client/ui_utils/define_nested_tree_context"
import {noop} from "client/ui_utils/noop"
import {RefObject, useCallback, useEffect, useMemo, useRef} from "react"

export const enum ModalHotkeyPriority {
	default = 0,
	alert = 100
}

type HotkeyHandler = {
	// this is optional because sometimes (see <Button>) this function may be absent, meaning "no hotkey"
	// end-users should always supply this one
	shouldPick?: (e: KeyboardEvent) => boolean
	onPress: (e: KeyboardEvent) => void
}

type Props = {
	priority?: ModalHotkeyPriority
}

type RootContextHandle = {
	priority: number
	getHandlers: () => HotkeyHandler[]
	disabledCounterRef: RefObject<number>
}
let knownRoots: RootContextHandle[] = []

const onWindowKeyDown = (e: KeyboardEvent) => {
	const activeRoots = knownRoots.filter(x => x.disabledCounterRef.current === 0)
	// this should pick one context with highest priority (maybe more, but when everything goes right - just one)
	// most of the time multiple contexts are resolved by disabling, hovewer there are situations possible when contexts have the same parent
	// for example, when a component defines a modal and an alert near that modal -
	// both modal and alert (which is also a modal) will have their own hotkey contexts
	// to resolve this, alert's hotkey context would have higher priority, because when alert is active - the screen is "blocked"
	// and no other alert/modal can be on top of that alert anyway
	// (it's not true for modals in general, because some modals could have nested modals)
	const highestPriority = activeRoots.map(x => x.priority).reduce((a, b) => Math.max(a, b), 0)
	const selectedRoots = activeRoots.filter(x => x.priority === highestPriority)

	const handlers = selectedRoots.flatMap(x => x.getHandlers()).filter(x => x.shouldPick?.(e))
	for(const handler of handlers){
		handler.onPress(e)
	}
}

const {useMaybeRootContext, RootProvider, NestedProvider} = defineNestedTreeContext({
	name: "HotkeyContext",
	useNestedValue: ({shouldPick, onPress}: HotkeyHandler) => {
		const ref = useRef({shouldPick, onPress})
		ref.current.shouldPick = shouldPick
		ref.current.onPress = onPress
		return ref.current
	},
	useRootValue: ({priority = 0}: Props, treeServices) => {
		const disabledCounterRef = useRef(0)
		const disable = useCallback(() => {
			disabledCounterRef.current++
		}, [])
		const enable = useCallback(() => {
			disabledCounterRef.current--
		}, [])

		const {enable: enableParent, disable: disableParent} = useMaybeRootContext()?.value ?? {disable: noop, enable: noop}
		useEffect(() => {
			if(!parent){
				return noop
			}
			disableParent()
			return () => {
				enableParent()
			}
		}, [enableParent, disableParent])

		const treeServiceRef = useRef(treeServices)
		treeServiceRef.current = treeServices

		const rootHandle: RootContextHandle = useMemo(() => ({
			disabledCounterRef,
			priority,
			getHandlers: () => treeServiceRef.current.getSortedByDepth()
		}), [priority])

		useEffect(() => {
			knownRoots.push(rootHandle)
			if(knownRoots.length === 1){
				window.addEventListener("keydown", onWindowKeyDown)
			}
			return () => {
				knownRoots = knownRoots.filter(x => x !== rootHandle)
				if(knownRoots.length === 0){
					window.removeEventListener("keydown", onWindowKeyDown)
				}
			}
		}, [rootHandle])

		return {disable, enable}
	}
})

export const HotkeyProvider = RootProvider
export const Hotkey = NestedProvider
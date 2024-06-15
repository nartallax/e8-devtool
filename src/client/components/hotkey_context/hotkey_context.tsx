import {defineContext} from "client/ui_utils/define_context"
import {nonNull} from "common/non_null"
import {RefObject, useCallback, useEffect, useRef} from "react"

type HotkeyHandler = {
	/** Reference to element that will receive the hotkey
	Only used for determining priority of calling the handlers */
	ref: RefObject<HTMLElement | SVGElement>
	// this is optional because sometimes (see <Button>) this function may be absent, meaning "no hotkey"
	// end-users should always supply this one
	shouldPick?: (e: KeyboardEvent) => boolean
	onPress: (e: KeyboardEvent) => void
}

export const [HotkeyContextProvider, useHotkeyContext] = defineContext({
	name: "HotkeyContext",
	useValue: () => {
		const handlers = useRef(new Set<HotkeyHandler>()).current
		const rootHandler = useCallback((e: KeyboardEvent) => {
			const eligibleHandlers: HotkeyHandler[] = []
			for(const handler of handlers){
				if(handler.shouldPick!(e)){
					eligibleHandlers.push(handler)
				}
			}


			for(const handler of findBestHandlers(eligibleHandlers)){
				handler.onPress(e)
			}
		}, [handlers])

		return {handlers, rootHandler}
	}
})

const updateSet = (handlers: Set<HotkeyHandler>, handler: HotkeyHandler, rootHandler: (e: KeyboardEvent) => void) => {
	if(!handler.shouldPick){
		const hadNonzero = handlers.size > 0
		handlers.delete(handler)
		if(hadNonzero && handlers.size === 0){
			window.removeEventListener("keydown", rootHandler)
		}
	} else {
		const hadZero = handlers.size === 0
		handlers.add(handler)
		if(hadZero && (handlers.size as number) === 1){
			window.addEventListener("keydown", rootHandler)
		}
	}
}

export const useHotkey = ({ref, shouldPick, onPress}: HotkeyHandler) => {
	const handler = useRef({ref, shouldPick, onPress}).current
	const {handlers, rootHandler} = useHotkeyContext()

	useEffect(() => {
		updateSet(handlers, handler, rootHandler)
		return () => {
			handlers.delete(handler)
			if(handlers.size === 0){
				window.removeEventListener("keydown", rootHandler)
			}
		}
	}, [handler, handlers, rootHandler])

	useEffect(() => {
		handler.ref = ref
		handler.shouldPick = shouldPick
		handler.onPress = onPress
		updateSet(handlers, handler, rootHandler)
	}, [ref, shouldPick, onPress, handler, handlers, rootHandler])
}

/* the idea is that one keypress should do only one thing
that means we can't call all eligible listeners at once

but we can't rely on focus either;
most of the time we want to capture hotkeys when the target element is not focused
(or not focusable at all, because it doesn't make any sense)

so this function exists, to pick only that one element that needs to receive the hotkey
logic is: we take most down-the-tree element. that's it.
reasoning is: we have modals, and we need for topmost modal (lowest in the tree) to receive hotkeys before modals under him (above in the tree)
and it also makes sense to first give hotkeys to something inside modal (cancel selection)
and only then give hotkey to modal itself (close) */
function findBestHandlers(handlers: HotkeyHandler[]): HotkeyHandler[] {
	if(handlers.length === 0){
		return []
	} else if(handlers.length === 1){
		return handlers
	}

	let chains = handlers
		.map(handler => {
			const el = handler.ref.current
			if(!el){
				return null
			}
			return {chain: buildElementChain(el), listener: handler}
		})
		.filter(nonNull)
	let currentParent: HTMLElement | SVGElement = document.body
	let currentIndex = 0
	while(chains.length > 1){
		const childArray = chains
			.map(({chain}) => chain[currentIndex])
			.filter((el): el is HTMLElement | SVGElement => !!el)
		const lowestChild = findLowestChild(currentParent, childArray)
		const filteredChains = chains.filter(({chain}) => chain[currentIndex] === lowestChild)
		if(filteredChains.length === 0){
			// the only case when it could happen - when there's more than one listener for an element
			// in which case we should invoke all of them
			break
		}
		chains = filteredChains
		currentIndex++
		currentParent = lowestChild
	}

	return chains.map(chain => chain.listener)
}

function findLowestChild(parent: HTMLElement | SVGElement, children: (HTMLElement | SVGElement)[]): (HTMLElement | SVGElement) {
	let maxIndex = 0
	let maxIndexChild = children[0]!
	for(const child of children){
		const index = indexOfChild(parent, child)
		if(index > maxIndex){
			maxIndex = index
			maxIndexChild = child
		}
	}
	return maxIndexChild
}

function indexOfChild(parent: HTMLElement | SVGElement, child: HTMLElement | SVGElement): number {
	for(let i = 0; i < parent.children.length; i++){
		if(parent.children[i] === child){
			return i
		}
	}
	throw new Error("The child is not child of parent")
}

function buildElementChain(el: HTMLElement | SVGElement): (HTMLElement | SVGElement)[] {
	const result = [el]
	while(el.parentElement && el.parentElement !== document.body){
		el = el.parentElement
		result.push(el)
	}
	return result.reverse()
}
import {onMount} from "@nartallax/cardboard-dom"

interface UiHotkeyListener {
	readonly el: HTMLElement | SVGElement
	readonly shouldPick: (e: KeyboardEvent) => boolean
	readonly handler: (e: KeyboardEvent) => void
}

let listeners: UiHotkeyListener[] = []

const rootListener = (e: KeyboardEvent) => {
	const eligibleListeners: UiHotkeyListener[] = []
	for(const listener of listeners){
		if(listener.shouldPick(e)){
			eligibleListeners.push(listener)
		}
	}

	for(const listener of findBestListeners(eligibleListeners)){
		listener.handler(e)
	}
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
function findBestListeners(listeners: UiHotkeyListener[]): UiHotkeyListener[] {
	if(listeners.length === 0){
		return []
	} else if(listeners.length === 1){
		return listeners
	}

	let chains = listeners.map(listener => ({chain: buildElementChain(listener.el), listener}))
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

function addListener(listener: UiHotkeyListener): void {
	listeners.push(listener)
	if(listeners.length === 1){
		document.body.addEventListener("keydown", rootListener)
	}
}

function removeListener(listener: UiHotkeyListener): void {
	listeners = listeners.filter(x => x !== listener)
	if(listeners.length === 0){
		document.body.removeEventListener("keydown", rootListener)
	}
}

export function attachUiHotkey(el: HTMLElement | SVGElement, isItTheKey: (e: KeyboardEvent) => boolean, handler: (e: KeyboardEvent) => void): void {
	const listener: UiHotkeyListener = {el, shouldPick: isItTheKey, handler}

	onMount(el, () => {
		addListener(listener)
		return () => removeListener(listener)
	}, {ifInDom: "call"})
}
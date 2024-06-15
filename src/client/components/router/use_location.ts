import {useLayoutEffect, useState} from "react"

const listeners = new Set<() => void>()
const callListeners = () => {
	for(const listener of listeners){
		listener()
	}
}

let isPatched = false
const patchHistory = () => {
	if(isPatched){
		return
	}
	isPatched = true

	const h = (window.history as any)

	const origReplace = h.replaceState
	h.replaceState = function(...args: unknown[]) {
		callListeners()
		return origReplace.call(this, ...args)
	}

	const origPush = h.pushState
	h.pushState = function(...args: unknown[]) {
		callListeners()
		return origPush.call(this, ...args)
	}
}

export const useLocation = (): URL => {
	patchHistory()

	const [location, setLocation] = useState(new URL(window.location + ""))

	// it's useLayoutEffect and not just useEffect because useEffect is too asynchronous
	// URL can change between this hook is called and useEffect taking place, losing us an update
	// with useLayoutEffect this should not happen
	useLayoutEffect(() => {
		const onChange = () => requestAnimationFrame(() => {
			setLocation(new URL(window.location + ""))
		})

		listeners.add(onChange)
		window.addEventListener("popstate", onChange, {passive: true})

		return () => {
			listeners.delete(onChange)
			window.removeEventListener("popstate", onChange)
		}
	}, [])

	return location
}
import {RBox, box} from "@nartallax/cardboard"
import {onMount} from "@nartallax/cardboard-dom"

export function onResize(el: HTMLElement, callback: (resizeEvent: ResizeObserverEntry) => void): void {
	onMount(el, () => {
		const observer = new ResizeObserver(entries => {
			for(const entry of entries){
				// I'm not sure if this check can be false in our case
				// maybe it will fire for nested elements..? this needs testing
				if(entry.target === el){
					callback(entry)
				}
			}
		})
		observer.observe(el)
		return () => observer.disconnect()
	})
}

interface DOMRectWithoutMethods {
	readonly width: number
	readonly height: number
	readonly x: number
	readonly y: number
	readonly top: number
	readonly bottom: number
	readonly left: number
	readonly right: number
}

function areRectsDifferent(a: DOMRectWithoutMethods, b: DOMRectWithoutMethods): boolean {
	return a.x !== b.x || a.y !== b.y || a.width !== b.width || a.height !== b.height || a.top !== b.top || a.bottom !== b.bottom || a.left !== b.left || a.right !== b.right
}

export function boundingRectBox(el: HTMLElement): RBox<DOMRectWithoutMethods> {
	const result = box<DOMRectWithoutMethods>({
		width: 0, height: 0, x: 0, y: 0, top: 0, bottom: 0, left: 0, right: 0
	})

	function tryUpdate(newValue: DOMRectWithoutMethods): void {
		if(areRectsDifferent(result.get(), newValue)){
			result.set(newValue)
		}
	}

	// contentRect is numerically equal to what .getBoundingClientRect() returns
	onResize(el, evt => tryUpdate(evt.contentRect))

	onMount(el, () => {
		tryUpdate(el.getBoundingClientRect())
	})

	return result
}
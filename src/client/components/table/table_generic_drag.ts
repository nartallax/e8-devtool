type XY = {x: number, y: number}

type XYAndTarget = XY & {
	target: HTMLElement
}

type Options = {
	thresholdPx: number
	direction?: "vertical" | "horisontal" | "both"
	canStartAt?: (xy: XYAndTarget) => boolean
	// called after threshold is cleared
	onStart?: (startXY: XYAndTarget) => void
	// called once after onStart and then each move
	onMove: (opts: {start: XYAndTarget, current: XYAndTarget}) => void
	// called after onStart and at least one onMove is called
	onEnd?: (opts: {start: XYAndTarget, end: XYAndTarget}) => void
	// called after threshold is not cleared on release
	onClick?: () => void
	reset?: (reason: ResetReason) => void
}

type ResetReason = "down" | "end" | "wrong_direction" | "click" | "shutdown"

export const makeTableDrag = (opts: Options) => {
	let dragStartCoords: XYAndTarget | null = null
	let lastKnownCoords: XYAndTarget | null = null
	let isMoving = false

	const cleanup = (reason: ResetReason) => {
		window.removeEventListener("mousemove", onMove)
		window.removeEventListener("touchmove", onMove)
		window.removeEventListener("mouseup", onUp)
		window.removeEventListener("touchend", onUp)
		dragStartCoords?.target.removeEventListener("click", preventClick)
		dragStartCoords = null
		lastKnownCoords = null
		isMoving = false
		opts.reset?.(reason)
	}

	const onDown = (e: TouchEvent | MouseEvent) => {
		const coords = extractCoordsAndTarget(e)
		if(!coords){
			return
		}

		const canStart = opts.canStartAt?.(coords)
		if(!canStart){
			return
		}

		cleanup("down")
		lastKnownCoords = dragStartCoords = coords
		window.addEventListener("mousemove", onMove, {passive: true})
		window.addEventListener("touchmove", onMove, {passive: true})
		window.addEventListener("mouseup", onUp)
		window.addEventListener("touchend", onUp)
		// I don't remember why it was there. probably to prevent something.
		// but it breaks legit use cases like clicking buttons inside table cells
		// coords.target.addEventListener("click", preventClick, {capture: true, once: true})
	}

	const preventClick = (e: MouseEvent) => {
		e.preventDefault()
		e.stopPropagation()
	}

	const onMove = (e: TouchEvent | MouseEvent) => {
		const coords = extractCoordsAndTarget(e)
		if(!coords || !dragStartCoords){
			return
		}

		if(!isMoving){
			const dx = Math.abs(coords.x - dragStartCoords.x)
			const dy = Math.abs(coords.y - dragStartCoords.y)
			const distance2 = (dx ** 2) + (dy ** 2)
			if(distance2 < opts.thresholdPx ** 2){
				return
			}
			const dir = dx > dy ? "horisontal" : "vertical"
			if(opts.direction && opts.direction !== "both" && opts.direction !== dir){
				cleanup("wrong_direction")
				return
			}

			// move actually starts here
			isMoving = true
			opts.onStart?.(dragStartCoords)
			window.getSelection()?.removeAllRanges()
		}

		lastKnownCoords = coords
		opts.onMove({start: dragStartCoords, current: coords})
	}

	const onUp = (e: TouchEvent | MouseEvent) => {
		if(!isMoving || !dragStartCoords || !lastKnownCoords){
			opts.onClick?.()
			cleanup("click")
			return
		}
		opts.onEnd?.({start: dragStartCoords, end: extractCoordsAndTarget(e) ?? lastKnownCoords})
		cleanup("end")
	}

	return {onDown, cleanup}
}

const isTouchEvent = (evt: TouchEvent | MouseEvent): evt is TouchEvent => "touches" in evt
const extractCoordsAndTarget = (event: TouchEvent | MouseEvent): XYAndTarget | null => {
	let x: number
	let y: number
	let eventTarget: EventTarget | null
	if(isTouchEvent(event)){
		const anyTouch = event.touches[0]
		if(!anyTouch){
			return null
		}
		x = anyTouch.clientX
		y = anyTouch.clientY
		eventTarget = anyTouch.target
	} else {
		x = event.clientX
		y = event.clientY
		eventTarget = event.target
	}

	const htmlTarget = findNearestHtmlElement(eventTarget)
	if(!htmlTarget){
		return null
	}

	return {x, y, target: htmlTarget}
}

const findNearestHtmlElement = (target: unknown): HTMLElement | null => {
	while(!!target && typeof(target) === "object"){
		if(target instanceof HTMLElement){
			return target
		}

		if("parent" in target && target.parent !== target){
			target = target.parent
			continue
		}

		return null
	}
	return null
}

export const findParentTable = (child: HTMLElement): HTMLElement => {
	let el: Element = child
	while(el !== document.body){
		const attrValue = el.getAttribute("data-table-id")
		if(attrValue){
			return el as HTMLElement
		}
		if(!el.parentElement){
			break
		}
		el = el.parentElement
	}
	throw new Error("Table element not found.")
}
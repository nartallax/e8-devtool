import {shallowCopyToObjectInplace} from "common/copy_to_object_inplace"
import {useMemo, useRef} from "react"

type XY = {x: number, y: number}

export type AnyPointerEvent = MouseEvent | React.MouseEvent | TouchEvent | React.TouchEvent | WheelEvent | React.WheelEvent

export function pointerEventsToClientCoords(e: AnyPointerEvent): XY {
	if(isTouchEvent(e)){
		const touch = (e.touches[0] ?? e.changedTouches[0])!
		return {
			x: touch.clientX,
			y: touch.clientY
		}
	} else {
		return {
			x: e.clientX,
			y: e.clientY
		}
	}
}

export function pointerEventsToOffsetCoords(e: AnyPointerEvent, target: unknown = null): XY | null {
	target ??= e.target
	if(!(target instanceof Element)){
		return null
	}

	const rect = target.getBoundingClientRect() // performance may suck, but whatever
	const coords = pointerEventsToClientCoords(e)
	coords.x -= rect.left
	coords.y -= rect.top
	return coords
}

export function pointerEventsToOffsetCoordsByRect(e: AnyPointerEvent, rect: DOMRect): XY {
	const coords = pointerEventsToClientCoords(e)
	coords.x -= rect.left
	coords.y -= rect.top
	return coords
}

export function isTouchEvent(e: AnyPointerEvent): e is TouchEvent | React.TouchEvent {
	return !!(e as TouchEvent | React.TouchEvent).touches
}

type DragState = {
	start: XY
	last: XY
	diff: XY
}

export type MouseDragHandlerParams = {
	/** start() is called before first onMove
	 * it can return false; it means that the move will not start */
	start?: (e: AnyPointerEvent, dragState: DragState) => boolean | undefined | void
	stop?: (e: AnyPointerEvent, dragState: DragState) => void
	onMove(e: AnyPointerEvent, dragState: DragState): void
	onClick?: (e: AnyPointerEvent) => void
	/** If true, onMove will be invoked when down event happen */
	downIsMove?: boolean
	/** If true, onMove will be invoked when up event happen */
	upIsMove?: boolean
	/** Distance in pixels that cursor should pass in down state before start and onmove is called */
	distanceBeforeMove?: number
	/** Expected movement direction.
	 * If after `distanceBeforeMove` is passed the direction of movement is not this - drag won't happen */
	constraintDirection?: "horisontal" | "vertical"
}

/** This is a good way to add a mousemove handler to an element */
export const useMouseDragProps = (params: MouseDragHandlerParams) => {
	const dragStateRef = useRef<DragState>({start: {x: 0, y: 0}, last: {x: 0, y: 0}, diff: {x: 0, y: 0}})
	const paramsRef = useRef(params)
	shallowCopyToObjectInplace(params, paramsRef.current)

	return useMemo(() => {
		const dragState = dragStateRef.current
		const params = paramsRef.current
		const dragTargetId = dragTargetIdCounter++
		const distanceBeforeMove2 = (params.distanceBeforeMove ?? 0) ** 2
		let isMoving = false
		let isClickingNow = false
		const isClickPreventionEnabled = true // params.element !== window

		const startMoving = (e: AnyPointerEvent, isDown: boolean): boolean => {
			isMoving = true
			if(!directionIsRight(dragState.start, pointerEventsToClientCoords(e))){
				stopMoving(e, false, true)
				return false
			}
			if(params.start){
				if(params.start(e, dragState) === false){
					stopMoving(e, false, true)
					return false
				}
			}
			if(params.downIsMove && isDown){
				params.onMove(e, dragState)
			}
			return true
		}

		const stopMoving = (e: AnyPointerEvent | null, isUp: boolean, shouldTriggerClick: boolean) => {
			window.removeEventListener("mousemove", onMove)
			window.removeEventListener("touchmove", onMove)
			window.removeEventListener("mouseup", onUp)
			window.removeEventListener("touchend", onUp)
			if(e){
				if(!isMoving && shouldTriggerClick){
					try {
						isClickingNow = true
						if(e.target instanceof HTMLElement && isClickPreventionEnabled){
							e.target.focus() // click does not focus inputs o_O
							e.target.click()
						}
						if(params.onClick){
							params.onClick(e)
						}
					} finally {
						isClickingNow = false
					}
				}
				if(params.upIsMove && isUp && isMoving){
					params.onMove(e, dragState)
				}
				if(params.stop && isUp && isMoving){
					params.stop(e, dragState)
				}
			}
			isMoving = false
		}

		const directionIsRight = (startCoords: XY, currentCoords: XY): boolean => {
			const dir = params.constraintDirection
			if(!dir){
				return true
			}
			const dx = Math.abs(startCoords.x - currentCoords.x)
			const dy = Math.abs(startCoords.y - currentCoords.y)
			const isHorisontal = dx >= dy
			return isHorisontal === (dir === "horisontal")
		}

		const targetIsRight = (e: AnyPointerEvent): boolean => findDragTargetId(e) === dragTargetId

		const onMove = (e: AnyPointerEvent): void => {
			if(isMultiTouchEvent(e)){
				stopMoving(e, false, false)
				return
			}
			const coords = pointerEventsToClientCoords(e)
			const start = dragState.start
			dragState.last = coords
			const diff = dragState.diff = {x: start.x - coords.x, y: start.y - coords.y}
			if(!isMoving){
				const distance2 = (diff.x ** 2) + (diff.y ** 2)
				if(distance2 >= distanceBeforeMove2){
					if(!startMoving(e, false)){
						return
					}
				} else {
					return
				}
			}
			params.onMove(e, dragState)
		}

		const onDown = (e: AnyPointerEvent): void => {
			if(e instanceof MouseEvent && e.buttons !== 1){
				return
			}
			if(!targetIsRight(e) || isMultiTouchEvent(e)){
			// if target check is true - this event is handled by another mouse drag handler
			// in basic cases we could just mouseEvent.stopPropagation()
			// but that breaks when logic about "let's wait for some distance before start" is introduced
			// because when you decide to stop - it's already too late to prevent propagation
				if(isMoving){
					stopMoving(e, false, true)
				}
				return
			}
			window.addEventListener("mousemove", onMove, {passive: true})
			window.addEventListener("touchmove", onMove, {passive: true})
			window.addEventListener("mouseup", onUp)
			window.addEventListener("touchend", onUp)
			dragState.start = pointerEventsToClientCoords(e)
			if(distanceBeforeMove2 <= 0){
				startMoving(e, true)
			}
		}

		const onUp = (e: MouseEvent | TouchEvent): void => {
			if(e.type === "touchend" && e.cancelable){
			// this is needed to prevent `mouseup` from also firing
				e.preventDefault()
			}
			stopMoving(e, true, true)
		}

		const resultProps: React.DOMAttributes<Element> & Record<string, string> = {}
		resultProps[dataAttrName] = dragTargetId + ""
		resultProps.onMouseDown = onDown
		resultProps.onTouchStart = onDown

		if(isClickPreventionEnabled){
			const clickPreventingHandler = (e: AnyPointerEvent) => {
				if(!targetIsRight(e)){
					return
				}
				if(!isClickingNow){
					e.stopPropagation()
				}
			}
			resultProps.onClickCapture = clickPreventingHandler
		}

		return resultProps
	}, [])
}

let dragTargetIdCounter = 0
const dataAttrName = "data-drag-target-id"

const isMultiTouchEvent = (e: AnyPointerEvent): e is TouchEvent => isTouchEvent(e) && e.touches.length > 1

const findDragTargetId = (e: AnyPointerEvent): number | null => {
	let el = e.target
	while(el){
		if(!(el instanceof HTMLElement) && !(el instanceof SVGElement)){
			if(el instanceof Node){
				el = el.parentNode
				continue
			}
			break
		}
		const attr = el.getAttribute(dataAttrName)
		const numAttr = parseInt(attr ?? "nan")
		if(Number.isFinite(numAttr)){
			return numAttr
		}
		if(!el.parentElement || el === el.parentElement){
			return null
		}
		el = el.parentNode
	}

	return null
}
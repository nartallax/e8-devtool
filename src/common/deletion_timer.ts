import {RBox, box} from "@nartallax/cardboard"
import {bindBox} from "@nartallax/cardboard-dom"

interface DeletionTimer {
	cancel(): void
	run(): void
	opacity: RBox<number>
}

export function attachDeletionTimerToButton(button: HTMLElement, container: HTMLElement, duration: number, doDelete: () => void): DeletionTimer {

	const stopTimerHandler = (e: Event) => {
		e.stopPropagation()
		timer.cancel()
		window.removeEventListener("mouseup", stopTimerHandler)
		window.removeEventListener("touchend", stopTimerHandler)
	}

	const startTimerHandler = (e: MouseEvent | TouchEvent) => {
		if(e.shiftKey){
			doDelete()
			timer.cancel()
			return
		}
		e.stopPropagation()
		timer.run()
		window.addEventListener("mouseup", stopTimerHandler)
		window.addEventListener("touchend", stopTimerHandler)
	}

	const wrappedDoDelete = () => {
		window.removeEventListener("mouseup", stopTimerHandler)
		window.removeEventListener("touchend", stopTimerHandler)
		doDelete()
	}

	const timer = makeDeletionTimer(duration, wrappedDoDelete)
	bindBox(container, timer.opacity, opacity => container.style.opacity = opacity + "")
	button.addEventListener("mousedown", startTimerHandler)
	button.addEventListener("touchstart", startTimerHandler)
	return timer
}

export function makeDeletionTimer(duration: number, afterEnd: () => void): DeletionTimer {
	let rafHandle: ReturnType<typeof requestAnimationFrame> | null = null
	let startTime = 0
	const opacity = box(1)

	const onFrame = () => {
		rafHandle = null
		const passedTime = Date.now() - startTime
		const passedRate = passedTime / duration
		if(passedRate >= 1){
			opacity.set(0)
			cancel()
			afterEnd()
			return
		}

		opacity.set(1 - passedRate)
		rafHandle = requestAnimationFrame(onFrame)
	}

	const cancel = () => {
		opacity.set(1)
		if(rafHandle){
			cancelAnimationFrame(rafHandle)
			rafHandle = null
		}
	}

	const run = () => {
		if(rafHandle){
			return
		}

		startTime = Date.now()
		onFrame()
	}

	return {run, cancel, opacity}
}
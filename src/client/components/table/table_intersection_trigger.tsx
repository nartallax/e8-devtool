import {PropsWithChildren, useEffect, useRef} from "react"
import * as css from "./table.module.css"
import {sleepFrame} from "client/ui_utils/sleep_frame"
import {reactMemo} from "common/react_memo"

type Props = {
	/** Number of pixels from last row when onBottomHit is triggered */
	triggerOffsetPx?: number
	onBottomHit: () => void | Promise<void>
}

export const TableIntersectionTrigger = reactMemo(({
	triggerOffsetPx = 0, onBottomHit
}: PropsWithChildren<Props>) => {
	const triggerRef = useRef<HTMLTableCellElement | null>(null)

	const triggerStyle = {
		display: "flex", // for typing
		"--trigger-offset": triggerOffsetPx + "px"
	}

	// there's absolutely no reason to re-create observer each time onBottomHit changes
	// it shouldn't meaningfully change anyway
	const onBottomHitRef = useRef(onBottomHit)
	onBottomHitRef.current = onBottomHit

	useEffect(() => {
		const trigger = triggerRef.current
		if(!trigger){
			return
		}
		let isLoading = false
		let isIntersecting = false
		let hitError = false

		const loadNextPage = async() => {
			if(isLoading || hitError){
				return
			}

			isLoading = true
			trigger.textContent = "Loading..."
			try {
				await Promise.resolve(onBottomHitRef.current())
			} catch(e){
				console.error("Failed to load next page for infinite scroll: ", e)
				// in case of error just assume that next load will throw the same error and give up
				hitError = true
				observer.disconnect()
			} finally {
				isLoading = false
				trigger.textContent = ""
			}

			await sleepFrame()
			if(isIntersecting){
				// after page is loaded, trigger is still in sight
				// we should try and load next page then
				await loadNextPage()
			}
		}

		const observer = new IntersectionObserver(async entries => {
			isIntersecting = entries.some(entry => entry.isIntersecting)
			await loadNextPage()
		})
		observer.observe(trigger)

		return () => {
			observer.disconnect()
			isIntersecting = false
		}
	}, [])

	return (
		<div className={css.tableInfiniteScrollRow}>
			<div className={css.tableInfiniteScrollTrigger} ref={triggerRef} style={triggerStyle}/>
		</div>
	)
})
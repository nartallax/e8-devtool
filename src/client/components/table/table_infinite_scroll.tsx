import {PropsWithChildren, useEffect, useRef, useState} from "react"
import * as css from "./table.module.css"
import {sleepFrame} from "client/ui_utils/sleep_frame"
import {reactMemo} from "common/react_memo"

type Props = {
	/** Number of pixels from last row when onBottomHit is triggered */
	triggerOffsetPx?: number
	/** Expected to return true if there's more, false if that's it */
	onBottomHit: () => boolean | Promise<boolean>
}

export const TableInfiniteScroll = reactMemo(({
	triggerOffsetPx = 0, onBottomHit, children
}: PropsWithChildren<Props>) => {
	const [isLoadedEverything, setLoadedEverything] = useState(false)
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
		let isLoadedEverything = false

		const loadNextPage = async() => {
			if(isLoading || isLoadedEverything){
				return
			}

			isLoading = true
			trigger.textContent = "Loading..."
			try {
				const isThereMore = await Promise.resolve(onBottomHitRef.current())
				if(!isThereMore){
					setLoadedEverything(true)
					isLoadedEverything = true
					observer.disconnect()
				}
			} catch(e){
				console.error("Failed to load next page for infinite scroll: ", e)
				// in case of error just assume that next load will throw the same error and give up
				setLoadedEverything(true)
				isLoadedEverything = true
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
		}
	}, [])

	return (
		<>
			{children}
			{!isLoadedEverything && <tr className={css.tableInfiniteScrollRow}>
				<td ref={triggerRef} className={css.tableInifiniteScrollTrigger} style={triggerStyle}/>
			</tr>}
		</>
	)
})
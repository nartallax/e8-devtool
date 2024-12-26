import {PropsWithChildren, useEffect, useRef, useState} from "react"
import * as css from "./table.module.css"
import {reactMemo} from "common/react_memo"

type Props = {
	/** Number of pixels from last row when onBottomHit is triggered */
	triggerOffsetPx?: number
	onBottomHit: () => void | Promise<void>
	canTrigger: boolean
}

export const TableIntersectionTrigger = reactMemo(({
	triggerOffsetPx = 0, onBottomHit, canTrigger
}: PropsWithChildren<Props>) => {
	const triggerRef = useRef<HTMLDivElement | null>(null)

	const [isIntersecting, setIsIntersecting] = useState(false)
	const [isLoading, setIsLoading] = useState(false)

	useEffect(() => {
		if(isLoading || !isIntersecting || !canTrigger){
			return
		}

		void(async() => {
			setIsLoading(true)
			try {
				await Promise.resolve(onBottomHit())
			} finally {
				setIsLoading(false)
			}
		})()
	}, [isIntersecting, isLoading, onBottomHit, canTrigger])

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

		const observer = new IntersectionObserver(entries => {
			setIsIntersecting(entries.some(entry => entry.isIntersecting))
		})
		observer.observe(trigger)

		return () => {
			observer.disconnect()
			setIsIntersecting(false)
		}
	}, [])

	return (
		<div className={css.tableInfiniteScrollRow}>
			<div className={css.tableInfiniteScrollTrigger} ref={triggerRef} style={triggerStyle}>
				{isLoading ? "Loading..." : ""}
			</div>
		</div>
	)
})
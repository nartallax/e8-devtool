import {RefObject, useEffect, useState} from "react"

type WH = {readonly width: number, readonly height: number}

const zeroRect: WH = {
	height: 0,
	width: 0
}

export const useElementSize = (ref: RefObject<HTMLElement | null>): WH => {
	const [rect, setRect] = useState(ref.current?.isConnected ? ref.current!.getBoundingClientRect() : {...zeroRect})

	useEffect(() => {
		const el = ref.current
		if(!el){
			throw new Error("Nothing to observe, ref is empty")
		}

		const observer = new ResizeObserver(entries => {
			for(const entry of entries){
				if(entry.target === el){
					setRect(entry.contentRect)
					return
				}
			}
		})

		observer.observe(el)
		return () => observer.disconnect()
	}, [ref])

	return rect
}
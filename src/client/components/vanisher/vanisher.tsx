import {CSSProperties, PropsWithChildren, useLayoutEffect, useRef, useState} from "react"

import * as css from "./vanisher.module.css"
import {MinMaxableSize, resolveMinMaxableSize} from "client/ui_utils/sizes"
import {cn} from "client/ui_utils/classname"

type Props<K extends keyof CSSProperties = keyof CSSProperties> = {
	property?: K
	emptyValue?: CSSProperties[K]
	fullValue?: CSSProperties[K]
	width?: MinMaxableSize
	height?: MinMaxableSize
	position?: "relative" | "absolute" | "fixed" | "static"
	retainPosition?: boolean
	zeroInset?: boolean
	duration?: number
	noStretch?: boolean
}

/** Component that slowly appears when mounted and slowly disappears after unmounted */
export const Vanisher = ({
	children,
	property = "opacity",
	emptyValue = "0",
	fullValue = "1",
	width,
	height,
	position = "static",
	zeroInset = false,
	duration = 250,
	retainPosition = false,
	noStretch = false
}: PropsWithChildren<Props>) => {
	const ref = useRef<HTMLDivElement>(null)
	const [isVisible, setIsVisible] = useState(false)

	const style = {
		[property]: isVisible ? fullValue : emptyValue,
		position,
		top: zeroInset ? "0" : "",
		bottom: zeroInset ? "0" : "",
		left: zeroInset ? "0" : "",
		right: zeroInset ? "0" : "",
		transition: `${property} ${duration / 1000}s`,
		...resolveMinMaxableSize("width", width),
		...resolveMinMaxableSize("height", height)
	}

	useLayoutEffect(() => {
		requestAnimationFrame(() => {
			setIsVisible(true)
		})

		return () => {
			setIsVisible(false)

			// all this useLayoutEffect is one big hack
			// but alas; the only sensible alternative is to always render excessive components,
			// and show/hide them with their internal properties, which is also not too great
			// (performance overhead, and internal state that won't go away after component is vanished)

			// eslint-disable-next-line react-hooks/exhaustive-deps
			const el = ref.current
			const parent = el?.parentElement
			if(!el || !parent){
				return
			}
			const nextSibling = el.nextSibling

			const posParent = findNearestPositionedParent(el)
			storeOnscreenLocation(posParent, el, retainPosition)

			requestAnimationFrame(() => {
				if(nextSibling){
					parent.insertBefore(el, nextSibling)
				} else {
					parent.appendChild(el)
				}
				requestAnimationFrame(() => {
					el.style.setProperty(property, emptyValue + "")
				})
			})

			setTimeout(() => {
				el.remove()
			}, duration)
		}
	}, [property, emptyValue, duration, retainPosition])

	return (
		<div className={cn(css.vanisher, {[css.noStretch!]: noStretch})} ref={ref} style={style}>
			{children}
		</div>
	)
}

const storeOnscreenLocation = (parent: HTMLElement, el: HTMLElement, retainPosition: boolean): void => {
	const childRect = el.getBoundingClientRect()
	const parentRect = parent.getBoundingClientRect()
	el.style.left = (childRect.left - parentRect.left) + "px"
	el.style.top = (childRect.top - parentRect.top) + "px"
	el.style.width = childRect.width + "px"
	el.style.height = childRect.height + "px"
	el.classList.add(css.vanishing!)
	if(!retainPosition){
		el.style.position = "absolute"
	}
}

const findNearestPositionedParent = (el: HTMLElement): HTMLElement => {
	let parent = el.parentElement
	while(parent){
		const style = getComputedStyle(parent)
		if(style.position === "absolute" || style.position === "relative"){
			return parent
		}
		parent = parent.parentElement
	}
	return document.body
}
import {MRBox} from "@nartallax/cardboard"
import * as css from "./swap_container.module.scss"
import {bindBox} from "@nartallax/cardboard-dom"
import {Container, ContainerProps} from "client/component/row_col/row_col"

interface Props extends ContainerProps {
	readonly content: MRBox<HTMLElement | string | null>
}

/** A container for some element that can be swapped for another element
 * Mostly exist for animation purposes, the swapping feature itself is implemented by cardboard-dom */
export const SwapContainer = (props: Props) => {
	const container = Container({...props, class: [props.class, css.swapContainer]})

	let contentWrap: HTMLElement | null = null
	let swapCount = 0
	bindBox(container, props.content, content => {
		if(contentWrap){
			const oldWrap = contentWrap
			const rect = oldWrap.getBoundingClientRect()
			oldWrap.style.top = "0"
			oldWrap.style.left = "0"
			oldWrap.style.width = rect.width + "px"
			oldWrap.style.height = rect.height + "px"
			oldWrap.style.position = "absolute"
			oldWrap.classList.add(css.hidden!)
			setTimeout(() => {
				oldWrap.remove()
			}, 200)
		}

		swapCount++
		const currentSwap = swapCount
		const wrap = contentWrap = Container({
			...props,
			class: [css.contentWrap, css.hidden]
		}, [content])

		container.appendChild(wrap)
		requestAnimationFrame(() => {
			if(currentSwap === swapCount){
				wrap.classList.remove(css.hidden!)
			}
		})
	})

	return container
}
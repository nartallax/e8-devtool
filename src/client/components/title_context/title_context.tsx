import {defineContext} from "client/ui_utils/define_context"
import {orderDomElementsInOrderOfAppearance} from "client/ui_utils/order_dom_elements_in_order_of_appearance"
import {RefObject, useEffect, useState} from "react"

type TitlePart = {
	ref: RefObject<Element>
	part: string
}

type Props = {
	defaultTitle?: string
}

const [_TitleProvider, useTitleContext] = defineContext({
	name: "TitleContext",
	useValue: ({defaultTitle = ""}: Props) => {
		const [parts, setParts] = useState<TitlePart[]>([])
		if(parts.length === 0){
			document.title = defaultTitle
		} else {
			const sortedParts = orderDomElementsInOrderOfAppearance(parts)
			document.title = sortedParts.map(x => x.part).join("")
		}
		return {setParts}
	}
})

export const TitleProvider = _TitleProvider

export const useTitlePart = (ref: RefObject<Element>, titlePart: string) => {
	const {setParts} = useTitleContext()
	useEffect(() => {
		const part: TitlePart = {ref, part: titlePart}
		setParts(parts => [...parts, part])
		return () => setParts(parts => parts.filter(somePart => somePart !== part))
	}, [titlePart, setParts, ref])
}
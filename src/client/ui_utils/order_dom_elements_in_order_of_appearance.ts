import {RefObject} from "react"

type Pack = {
	ref: RefObject<Element>
}

/** Having a set of elements, order them in a way they appear in the tree
Most intuitive understanding of result would be "as seen in devtools" */
export const orderDomElementsInOrderOfAppearance = <T extends Pack>(packs: T[]): T[] => {
	return packs
		.map(pack => {
			const el = pack.ref.current
			if(!el){
				throw new Error("No element")
			}
			const chain = buildIndexChain(el)
			return {pack, chain}
		})
		.sort((a, b) => isChainBigger(a.chain, b.chain) ? 1 : -1)
		.map(({pack}) => pack)
}

const isChainBigger = (a: number[], b: number[]): boolean => {
	const len = Math.min(a.length, b.length)
	for(let i = 0; i < len; i++){
		const aValue = a[i]!
		const bValue = b[i]!
		if(aValue < bValue){
			return false
		} else if(aValue > bValue){
			return true
		}
	}

	return a.length > b.length
}

const buildIndexChain = (el: Element): number[] => {
	const result = []
	while(el !== document.body){
		result.push(indexOfChild(el))
		const parent = el.parentElement
		if(!parent){
			throw new Error("Element is detached from DOM")
		}
		el = parent
	}
	return result.reverse()
}

const indexOfChild = (child: Element): number => {
	const parent = child.parentElement
	if(!parent){
		throw new Error("No parent!")
	}

	for(let i = 0; i < parent.children.length; i++){
		if(parent.children[i] === child){
			return i
		}
	}

	throw new Error("Wut")
}
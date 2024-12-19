import {findParentTable} from "client/components/table/table_generic_drag"

/** A class that helps with drag-n-drop of column headers by performing some calculations on column sizes */
export class TableHeaderColumnSizeCounter {
	private currentIndex: number
	private readonly widths: number[]
	readonly header: HTMLElement
	private readonly startScroll: number
	private readonly table: HTMLElement

	minOffset: number | null = null
	maxOffset: number | null = null

	constructor(target: HTMLElement, private startX: number) {
		const header = this.header = findNearestHeader(target)!
		const table = this.table = findParentTable(target)
		this.startScroll = table.scrollLeft

		const allHeaders: HTMLElement[] = arrayLikeToArray(table.querySelectorAll("[data-column-id]"))
		const colId = header.getAttribute("data-column-id")
		const targetIndex = allHeaders.findIndex(el => el.getAttribute("data-column-id") === colId)

		let widths: number[] = []
		for(let prevIndex = targetIndex - 1; prevIndex >= 0; prevIndex--){
			const prevHeader = allHeaders[prevIndex]!
			if(prevHeader.getAttribute("data-is-swappable") !== "true"){
				break
			}
			widths.push(prevHeader.getBoundingClientRect().width)
		}
		widths = widths.reverse()
		this.currentIndex = widths.length
		for(let nextIndex = targetIndex + 1; nextIndex < allHeaders.length; nextIndex++){
			const nextHeader = allHeaders[nextIndex]!
			if(nextHeader.getAttribute("data-is-swappable") !== "true"){
				break
			}
			widths.push(nextHeader.getBoundingClientRect().width)
		}

		this.widths = widths
		this.recalcOffsets()
	}

	swap(direction: -1 | 1) {
		this.startX += this.widths[this.currentIndex + (direction === -1 ? -1 : 0)]! * direction
		this.currentIndex += direction
		this.recalcOffsets()
	}

	getOffset(currentX: number) {
		const dScroll = this.table.scrollLeft - this.startScroll
		const dX = currentX - this.startX
		let offset = dX + dScroll
		if(this.minOffset === null && offset < 0){
			offset = 0
		} else if(this.maxOffset === null && offset > 0){
			offset = 0
		}
		return offset
	}

	getSwapDirection(offset: number): -1 | 1 | null {
		if(this.minOffset !== null && offset < this.minOffset){
			return -1
		} else if(this.maxOffset !== null && offset > this.maxOffset){
			return 1
		} else {
			return null
		}
	}

	private recalcOffsets() {
		this.minOffset = this.currentIndex <= 0 ? null : -(this.widths[this.currentIndex - 1]! / 2)
		this.maxOffset = this.currentIndex >= this.widths.length ? null : (this.widths[this.currentIndex]! / 2)
	}
}


const arrayLikeToArray = <T>(arr: {[index: number]: T, length: number}): T[] => {
	const result = new Array(arr.length)
	for(let i = 0; i < arr.length; i++){
		result[i] = arr[i]
	}
	return result
}

const findNearestHeader = (el: HTMLElement): HTMLElement | null => {
	while(el !== document.body){
		const attr = el.getAttribute("data-column-id")
		if(attr){
			return el
		}
		if(!el.parentElement){
			return null
		}
		el = el.parentElement
	}
	return null
}
import {findParentTable} from "client/components/table/table_generic_drag"
import {findNearestTableHeader} from "client/components/table/table_header_column_drag_helper"
import {SetState} from "client/ui_utils/react_types"
import {arrayLikeToArray} from "common/array_like_to_array"
import * as css from "./table.module.css"

type HeaderDescription = {
	initialWidth: number
	width: number
	canBeChanged: boolean
	colId: string
}

export class TableHeaderResizeHelper {
	private readonly startScroll: number
	private readonly descriptions: HeaderDescription[]
	private readonly table: HTMLElement
	private readonly targetIndex: number

	constructor(readonly minWidth: number, readonly setOverrides: SetState<ReadonlyMap<string, number>>, target: HTMLElement, readonly startX: number) {
		this.table = findParentTable(target)
		this.startScroll = this.table.scrollLeft
		const colId = findNearestTableHeader(target)!.getAttribute("data-column-id")
		const allHeaders: HTMLElement[] = arrayLikeToArray(this.table.querySelectorAll("[data-column-id]"))
		this.descriptions = allHeaders.map(header => {
			const width = header.getBoundingClientRect().width
			return {
				width,
				initialWidth: width,
				isChanged: false,
				canBeChanged: header.getAttribute("data-is-resizeable") === "true",
				colId: header.getAttribute("data-column-id")!
			}
		})
		this.targetIndex = this.descriptions.findIndex(desc => desc.colId === colId)
		if(target.classList.contains(css.columnRightResizer!)){
			this.targetIndex++
		}
	}

	onMove(x: number) {
		const dScroll = this.table.scrollLeft - this.startScroll
		const dX = x - this.startX
		let offset = dX + dScroll

		// each time we resize columns, one side will shrink and other will grow
		// shrinking can propagate through several columns, because minWidth exists
		// and some offsets will be larger than what columns can be shrunk to, and need to be reduced
		// growing, however, is unlimited, that's why we apply it after all the shrinking
		const direction = offset > 0 ? 1 : -1
		offset = Math.abs(offset)
		let remOffset = offset
		const growingColIndex = this.targetIndex + (direction === 1 ? -1 : 0)
		for(let shrinkingColIndex = growingColIndex + direction; shrinkingColIndex >= 0 && shrinkingColIndex < this.descriptions.length; shrinkingColIndex += direction){
			const shrinkingCol = this.descriptions[shrinkingColIndex]!
			if(!shrinkingCol.canBeChanged){
				break
			}
			shrinkingCol.width = Math.max(this.minWidth, shrinkingCol.initialWidth - remOffset)
			const offsetConsumed = shrinkingCol.initialWidth - shrinkingCol.width
			remOffset -= offsetConsumed
			if(remOffset === 0){
				break
			}
		}


		// if we could not fit some of the offset into columns - let's reduce initial offset
		offset -= remOffset
		const growingCol = this.descriptions[growingColIndex]!
		growingCol.width = growingCol.initialWidth + offset

		this.writeSizes()
	}

	private writeSizes() {
		this.setOverrides(overrides => {
			const map = new Map(overrides)
			for(const col of this.descriptions){
				if(col.width !== col.initialWidth){
					map.set(col.colId, col.width)
				}
			}
			return map
		})
	}
}
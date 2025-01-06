import {SetState} from "client/ui_utils/react_types"
import * as css from "./table.module.css"
import {TableUtils} from "client/components/table/table_utils"

type HeaderDescription = {
	readonly initialWidth: number
	width: number
	readonly canBeChanged: boolean
	readonly colId: string
}

export class TableHeaderResizeHelper {
	private readonly startScroll: number
	private readonly descriptions: HeaderDescription[]
	private readonly table: HTMLElement
	private readonly targetIndex: number

	constructor(readonly minWidth: number, readonly setOverrides: SetState<ReadonlyMap<string, number>>, target: HTMLElement, readonly startX: number) {
		this.table = TableUtils.findParentTable(target)
		this.startScroll = this.table.scrollLeft
		const [colId] = TableUtils.findNearestColumnHeader(target)
		const allHeaders = TableUtils.getColumnHeadersByEventTarget(target)
		this.descriptions = allHeaders.map(([id, header]) => {
			const width = header.getBoundingClientRect().width
			return {
				width,
				initialWidth: width,
				canBeChanged: header.getAttribute("data-is-resizeable") === "true",
				colId: id
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
		let offset = Math.round(dX + dScroll)

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
			// break-ing here if remOffset is zero would be wrong
			// because when offset is reducing, some columns that were shrunk before may not be shrunk now
			// and we need to update their widths to restore them back to initial
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
				if(col.width !== col.initialWidth || map.get(col.colId) !== col.width){
					map.set(col.colId, col.width)
				}
			}
			return map
		})
	}
}
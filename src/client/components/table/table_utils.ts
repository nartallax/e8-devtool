import {TableHierarchy, TableHierarchyEntry, TableProps, TableRowSequenceDesignator} from "client/components/table/table"
import * as css from "./table.module.css"

export namespace TableUtils {

	type GetChildren<T> = TableProps<T>["getChildren"]

	export const pathToHierarchy = <T>(data: readonly T[], getChildren: GetChildren<T>, path: readonly number[]): TableHierarchy<T> => {
		const result: TableHierarchyEntry<T>[] = []
		let rows: readonly T[] | null | undefined = data
		for(const index of path){
			const childRow: T | undefined = rows?.[index]
			if(!childRow){
				throw new Error(`Cannot find data line for path ${JSON.stringify(path)}`)
			}
			result.push({row: childRow, parentLoadedRowsCount: rows!.length, rowIndex: index})
			rows = getChildren?.(childRow)
		}
		return result
	}

	const findRow = <T>(data: readonly T[], getChildren: GetChildren<T>, path: readonly number[]): T | null => {
		let rows: readonly T[] | null | undefined = data
		let node: T | undefined
		for(let i = 0; i < path.length; i++){
			const rowIndex = path[i]!
			node = rows?.[rowIndex]
			if(!node){
				break
			}
			rows = getChildren?.(node)
		}
		return node ?? null
	}

	export const findRowOrThrow = <T>(data: readonly T[], getChildren: GetChildren<T>, path: readonly number[]): T => {
		const node = findRow(data, getChildren, path)
		if(!node){
			throw new Error(`Cannot find cache node for path ${JSON.stringify(path)}`)
		}
		return node
	}

	export const findParentRowOrThrow = <T>(data: readonly T[], getChildren: GetChildren<T>, path: readonly number[]): T => {
		if(path.length === 0){
			throw new Error("Cannot get parent of root cache node.")
		}
		return findRowOrThrow(data, getChildren, path.slice(0, path.length - 1))
	}

	export const locationMatchesHierarchy = <T>(location: readonly number[], hierarchy: TableHierarchy<T>): boolean => {
		if(location.length !== hierarchy.length){
			return false
		}

		// we go in reverse here because statistically we will find first discrepancy faster this way
		for(let i = location.length - 1; i >= 0; i--){
			if(location[i] !== hierarchy[i]!.rowIndex){
				return false
			}
		}

		return true
	}

	export const locationsAreEqual = (a: readonly number[], b: readonly number[]): boolean => {
		if(a.length !== b.length){
			return false
		}

		for(let i = a.length - 1; i >= 0; i--){
			if(a[i] !== b[i]){
				return false
			}
		}

		return true
	}

	export const hierarchiesAreEqualByIndex = <T>(a: TableHierarchy<T>, b: TableHierarchy<T>): boolean => {
		if(a.length !== b.length){
			return false
		}

		for(let i = a.length - 1; i >= 0; i--){
			if(a[i]!.rowIndex !== b[i]!.rowIndex){
				return false
			}
		}

		return true
	}

	export const isHierarchyIncludedInDesignator = <T>(hierarchy: TableHierarchy<T>, designator: TableRowSequenceDesignator) => {
		if(designator.firstRow.length !== hierarchy.length || hierarchy.length < 1){
			return false
		}
		const lastHierarchyIndex = hierarchy[hierarchy.length - 1]!.rowIndex
		const lastDesignatorIndex = designator.firstRow[designator.firstRow.length - 1]!
		if(lastHierarchyIndex < lastDesignatorIndex || lastHierarchyIndex >= lastDesignatorIndex + designator.count){
			return false
		}
		for(let i = hierarchy.length - 2; i >= 0; i--){
			if(hierarchy[i]!.rowIndex !== designator.firstRow[i]){
				return false
			}
		}
		return true
	}

	export const hierarchyStartsWithLocation = <T>(location: readonly number[], hierarchy: TableHierarchy<T>): boolean => {
		if(location.length < hierarchy.length){
			return false
		}

		for(let i = 0; i < hierarchy.length; i++){
			if(location[i] !== hierarchy[i]!.rowIndex){
				return false
			}
		}

		return true
	}

	export const findParentTable = (child: Node): HTMLElement => {
		let el: Node = child
		while(el !== document.body){
			if(el instanceof HTMLElement){
				const attrValue = el.getAttribute("data-table-id")
				if(attrValue){
					return el
				}
			}
			if(!el.parentElement){
				break
			}
			el = el.parentElement
		}
		throw new Error("Table element not found.")
	}

	export const findNearestColumnHeader = (el: HTMLElement): [id: string, el: HTMLElement] => {
		while(el !== document.body){
			const id = el.getAttribute("data-column-id")
			if(id){
				return [id, el]
			}
			if(!el.parentElement){
				break
			}
			el = el.parentElement
		}
		throw new Error("No column element found.")
	}

	export const findNearestRowPath = (el: Node): number[] | null => {
		while(el !== document.body){
			if(el instanceof HTMLElement){
				const path = el.getAttribute("data-tree-path")
				if(path){
					return JSON.parse(path)
				}
			}
			if(!el.parentNode){
				break
			}
			el = el.parentNode
		}
		return null
	}

	export const getHeadersRow = (el: Node): HTMLElement | null => {
		const table = findParentTable(el)
		return table.querySelector("." + css.tableHeaders!) ?? null
	}

	export const getAnyRowCellByLocation = (el: Node, loc: readonly number[]): HTMLElement => {
		const table = findParentTable(el)
		const cell = table.querySelector(`[data-tree-path="${JSON.stringify(loc)}"]`)
		if(!(cell instanceof HTMLElement)){
			throw new Error("No cell found by location " + loc.join(","))
		}
		return cell
	}

	export const getColumnHeadersByEventTarget = (target: HTMLElement): [id: string, el: HTMLElement][] => {
		const query = findParentTable(target).querySelectorAll("[data-column-id]")
		const result = new Array(query.length)
		for(let i = 0; i < result.length; i++){
			const el = query[i]!
			result[i] = [el.getAttribute("data-column-id"), el]
		}
		return result
	}

}
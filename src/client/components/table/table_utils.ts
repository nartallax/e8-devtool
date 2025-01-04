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

	export const designatorToRows = <T>(designator: TableRowSequenceDesignator, data: readonly T[], getChildren?: GetChildren<T>) => {
		let parentRows: readonly T[]
		if(designator.firstRow.length < 2){
			parentRows = data
		} else {
			const parent = findParentRowOrThrow(data, getChildren, designator.firstRow)
			parentRows = getChildren?.(parent) ?? []
		}
		const index = designator.firstRow[designator.firstRow.length - 1]!
		return parentRows.slice(index, index + designator.count)
	}

	export const findRowOrThrow = <T>(data: readonly T[], getChildren: GetChildren<T>, path: readonly number[]): T => {
		const node = findRow(data, getChildren, path)
		if(!node){
			console.log({data, getChildren, path})
			throw new Error(`Cannot find row for path ${JSON.stringify(path)}`)
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
		return locationsAreEqual(a.map(x => x.rowIndex), b.map(x => x.rowIndex))
	}

	export const isLocationIncludedInDesignator = (location: readonly number[], designator: TableRowSequenceDesignator) => {
		if(designator.firstRow.length !== location.length || location.length < 1){
			return false
		}
		const lastHierarchyIndex = location[location.length - 1]!
		const lastDesignatorIndex = designator.firstRow[designator.firstRow.length - 1]!
		if(lastHierarchyIndex < lastDesignatorIndex || lastHierarchyIndex >= lastDesignatorIndex + designator.count){
			return false
		}
		for(let i = location.length - 2; i >= 0; i--){
			if(location[i] !== designator.firstRow[i]){
				return false
			}
		}
		return true
	}

	export const isHierarchyIncludedInDesignator = <T>(hierarchy: TableHierarchy<T>, designator: TableRowSequenceDesignator) => {
		return isLocationIncludedInDesignator(hierarchy.map(x => x.rowIndex), designator)
	}

	export const locationStartsWithLocation = (prefix: readonly number[], biggerLocation: readonly number[]): boolean => {
		if(biggerLocation.length < prefix.length){
			return false
		}

		for(let i = prefix.length - 1; i >= 0; i--){
			if(biggerLocation[i] !== prefix[i]){
				return false
			}
		}

		return true
	}

	export const hierarchyStartsWithLocation = <T>(location: readonly number[], hierarchy: TableHierarchy<T>): boolean => {
		return locationStartsWithLocation(location, hierarchy.map(x => x.rowIndex))
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

	export const updateMovePath = (from: readonly number[], to: readonly number[], amount: number): number[] => {
		const result = [...to]
		if(from.length > to.length){
			return result
		}
		for(let i = 0; i < from.length; i++){
			if(from[i]! < to[i]!){
				result[i]! -= amount
				break
			}
		}
		return result
	}

	export const updateMoveDesignator = (from: TableRowSequenceDesignator, to: TableRowSequenceDesignator): TableRowSequenceDesignator => {
		const path = updateMovePath(from.firstRow, to.firstRow, to.count)
		return {firstRow: path, count: to.count}
	}

}
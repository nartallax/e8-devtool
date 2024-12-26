import {Forest, isTreeBranch, Tree} from "@nartallax/forest"
import {Col} from "client/components/row_col/row_col"
import {Table, TableBottomHitEvent, TableRow, TableRowMoveEvent} from "client/components/table/table"
import {anyToString} from "common/any_to_string"
import {useCallback, useMemo, useState} from "react"

const columns = {
	length: {header: "length", width: "75px", isSwappable: false},
	name: {header: "name", width: "1fr", isTreeColumn: true},
	lengthAndName: {header: "length + name", width: "2fr"}
}
type ColKey = keyof typeof columns

const treesToTableRows = (trees: readonly Tree<string, string>[]): TableRow<ColKey>[] => trees.map(tree => ({
	length: tree.value.length,
	name: tree.value,
	lengthAndName: tree.value.length + " " + tree.value,
	key: tree.value,
	children: !isTreeBranch(tree) ? undefined : treesToTableRows(tree.children)
}))

export const TableExample = () => {
	const [tableData, setTableData] = useState(() => new Forest<string, string>([]))
	const pagesTotal = 4

	const onBottomHit = useCallback(async(evt: TableBottomHitEvent<ColKey>) => {
		const nums = ["one", "two", "three", "four", "five", "six"]
		const nextPageIndex = evt.knownRows.length / nums.length
		if(nextPageIndex >= pagesTotal){
			return false
		}
		await new Promise(ok => setTimeout(ok, 100))
		const treePath = evt.hierarchy.map(x => x.rowIndex)
		treePath.push(evt.knownRows.length)
		const treeNodes: Tree<string, string>[] = nums.map(x => {
			x = nextPageIndex + " " + x
			if(evt.parentRow){
				x = anyToString(evt.parentRow.name) + " " + x
			}
			if(x.length % 2){
				return {value: x, children: []}
			} else {
				return {value: x}
			}
		})
		setTableData(forest => forest.insertTreesAt(treePath, treeNodes))
		return true
	}, [])

	const onRowMoved = useCallback((evt: TableRowMoveEvent<ColKey>) => {
		setTableData(forest => forest.move(evt.oldLocation, evt.newLocation))
	}, [])

	const rows = useMemo(() => treesToTableRows(tableData.trees), [tableData])


	return (
		<Col margin grow>
			<Table
				areColumnsOrderable
				areColumnsSwappable
				areColumnsResizeable
				maxOrderedColumns={2}
				localStorageId='test'
				onRowMoved={onRowMoved}
				rows={rows}
				onBottomHit={onBottomHit}
				columns={columns}
			/>
		</Col>
	)
}
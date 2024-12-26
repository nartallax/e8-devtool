import {Forest, isTreeBranch, Tree} from "@nartallax/forest"
import {Col} from "client/components/row_col/row_col"
import {Table, TableBottomHitEvent, TableColumnDefinition, TableRowMoveEvent} from "client/components/table/table"
import {useCallback, useMemo, useState} from "react"

export const TableExample = () => {
	const [tableData, setTableData] = useState(() => new Forest<string, string>([]))
	const pagesTotal = 4

	const onBottomHit = useCallback(async(evt: TableBottomHitEvent<Tree<string, string>>) => {
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
				x = evt.parentRow.value + " " + x
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

	const onRowMoved = useCallback((evt: TableRowMoveEvent<Tree<string, string>>) => {
		setTableData(forest => forest.move(evt.oldLocation, evt.newLocation))
	}, [])


	return (
		<Col margin grow>
			<Table<Tree<string, string>>
				areColumnsOrderable
				areColumnsSwappable
				areColumnsResizeable
				maxOrderedColumns={2}
				localStorageId='test'
				getRowKey={useCallback(tree => tree.value, [])}
				canHaveChildren={isTreeBranch}
				onRowMoved={onRowMoved}
				getChildren={useCallback((tree: Tree<string, string>) => isTreeBranch(tree) ? tree.children : [], [])}
				data={tableData.trees}
				onBottomHit={onBottomHit}
				columns={useMemo<TableColumnDefinition<Tree<string, string>>[]>(() => [
					{
						id: "length", header: "length", width: "75px", render: x => x.row.value.length, isSwappable: false
					},
					{
						id: "name", header: "name", width: "1fr", render: x => x.row.value, isTreeColumn: true
					},
					{
						id: "length_and_Name", header: "length + name", width: "2fr", render: x => x.row.value.length + " " + x.row.value
					}
				], [])}
			/>
		</Col>
	)
}
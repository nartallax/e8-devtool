import {Forest, isTreeBranch, Tree} from "@nartallax/forest"
import {Button} from "client/components/button/button"
import {Col} from "client/components/row_col/row_col"
import {Table, TableBottomHitEvent, TableEditCompletedEvent, TableRow, TableRowEditorProps, TableRowMoveEvent} from "client/components/table/table"
import {TextInput} from "client/components/text_input/text_input"
import {anyToString} from "common/any_to_string"
import {useCallback, useMemo, useRef, useState} from "react"

const columns = {
	length: {header: "length", width: "75px", isSwappable: false},
	name: {header: "name", width: "1fr", isTreeColumn: true},
	lengthAndName: {header: "length + name", width: "2fr"},
	buttons: {}
}
type ColKey = keyof typeof columns

const treesToTableRows = (trees: readonly Tree<string, string>[], onAdd: (path: number[]) => void, onEdit: (path: number[]) => void, path: number[] = []): TableRow<ColKey>[] => trees.map((tree, i) => ({
	length: tree.value.length,
	name: tree.value,
	lengthAndName: tree.value.length + " " + tree.value,
	buttons: isTreeBranch(tree) ? <Button
		text="Add"
		onClick={() => {
			onAdd([...path, i, 0])
		}}
	/> : <Button
		text="Edit"
		onClick={() => {
			onEdit([...path, i])
		}}
	/>,
	key: tree.value,
	children: !isTreeBranch(tree) ? undefined : treesToTableRows(tree.children, onAdd, onEdit, [...path, i])
}))

export const TableExample = () => {
	const [tableData, setTableData] = useState(() => new Forest<string, string>([]))
	const pagesTotal = 4

	const [newRowPath, setNewRowPath] = useState<number[] | null>(null)
	const [editedRowPath, setEditedRowPath] = useState<number[] | null>(null)

	const onBottomHit = useCallback(async(evt: TableBottomHitEvent<ColKey>) => {
		const nums = ["one", "two", "three", "four", "five", "six"]
		const nextPageIndex = evt.knownRows.length / nums.length
		if(nextPageIndex >= pagesTotal){
			return
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
	}, [])

	const onRowMoved = useCallback((evt: TableRowMoveEvent<ColKey>) => {
		setTableData(forest => forest.move(evt.oldLocation, evt.newLocation))
	}, [])

	const rows = useMemo(() => treesToTableRows(tableData.trees, setNewRowPath, setEditedRowPath), [tableData])

	return (
		<Col margin grow gap>
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
				createdRow={newRowPath}
				editedRow={editedRowPath}
				getRowEditor={useCallback((props: TableRowEditorProps<ColKey>) => {
					return RowEditor(props)
				}, [])}
				onEditCompleted={useCallback((e: TableEditCompletedEvent<ColKey>) => {
					setEditedRowPath(null)
					const row = e.row
					if(!row){
						return
					}

					setTableData(tableData => tableData.updateLeafAt(e.location, () => anyToString(row.name)))
				}, [])}
				onCreateCompleted={useCallback((e: TableEditCompletedEvent<ColKey>) => {
					setNewRowPath(null)
					const row = e.row
					if(!row){
						return
					}

					setTableData(tableData => tableData.insertLeafAt(e.location, anyToString(row.name)))
				}, [])}
			/>
		</Col>
	)
}

const RowEditor = ({row, onDone}: TableRowEditorProps<ColKey>) => {
	const [name, setName] = useState(!row ? "" : anyToString(row.name))
	return (
		<TextInput
			inputRef={useRef<HTMLInputElement | null>(null)}
			value={name}
			onChange={setName}
			onBlur={() => onDone(!name ? null : {
				buttons: null, name, length: null, lengthAndName: null, key: name
			})}
		/>
	)
}
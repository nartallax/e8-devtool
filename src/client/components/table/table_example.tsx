import {Forest, isTreeBranch, Tree} from "@nartallax/forest"
import {Button} from "client/components/button/button"
import {Col} from "client/components/row_col/row_col"
import {Table, TableBottomHitEvent, TableColumnDefinition, TableEditCompletedEvent, TableRowEditorProps, TableRowMoveEvent} from "client/components/table/table"
import {TextInput} from "client/components/text_input/text_input"
import {anyToString} from "common/any_to_string"
import {useCallback, useMemo, useRef, useState} from "react"

const getColumns = (onAdd: (path: number[]) => void, onEdit: (path: number[]) => void): TableColumnDefinition<Row>[] => [
	{
		id: "length", header: "length", width: "75px", isSwappable: false, render: ({row}) => row.value.length
	},
	{
		id: "name", header: "name", width: "1fr", isTreeColumn: true, render: ({row}) => row.value
	},
	{
		id: "lengthAndName", header: "length + name", width: "2fr", render: ({row}) => row.value.length + " " + row.value
	},
	{
		id: "buttons", render: ({row, hierarchy}) => isTreeBranch(row) ? <Button
			text="Add"
			onClick={() => {
				onAdd([...hierarchy.map(x => x.rowIndex), 0])
			}}
		/> : <Button
			text="Edit"
			onClick={() => {
				onEdit(hierarchy.map(x => x.rowIndex))
			}}
		/>
	}
]
type Row = Tree<string, string>

export const TableExample = () => {
	const [tableData, setTableData] = useState(() => new Forest<string, string>([]))
	const pagesTotal = 4

	const [newRowPath, setNewRowPath] = useState<number[] | null>(null)
	const [editedRowPath, setEditedRowPath] = useState<number[] | null>(null)

	const columns = useMemo(() => getColumns(setNewRowPath, setEditedRowPath), [setNewRowPath, setEditedRowPath])

	const onBottomHit = useCallback(async(evt: TableBottomHitEvent<Row>) => {
		const nums = ["one", "two", "three", "four", "five", "six"]
		const nextPageIndex = evt.knownRows.length / nums.length
		if(nextPageIndex >= pagesTotal){
			return
		}
		await new Promise(ok => setTimeout(ok, 100))
		if(evt.parentRow?.value.includes("one")){
			return
		}
		const treePath = evt.hierarchy.map(x => x.rowIndex)
		treePath.push(evt.knownRows.length)
		const treeNodes: Tree<string, string>[] = nums.map(x => {
			x = nextPageIndex + " " + x
			if(evt.parentRow){
				x = anyToString(evt.parentRow.value) + " " + x
			}
			if(x.length % 2){
				return {value: x, children: []}
			} else {
				return {value: x}
			}
		})
		setTableData(forest => forest.insertTreesAt(treePath, treeNodes))
	}, [])

	const onRowMoved = useCallback((evt: TableRowMoveEvent<Row>) => {
		setTableData(forest => forest.move(evt.oldLocation, evt.newLocation))
	}, [])

	return (
		<Col margin grow gap>
			<Table<Row>
				getRowKey={useCallback((row: Row) => row.value, [])}
				getChildren={useCallback((row: Row) => isTreeBranch(row) ? row.children : null, [])}
				areColumnsOrderable
				areColumnsSwappable
				areColumnsResizeable
				maxOrderedColumns={2}
				localStorageId='test'
				onRowMoved={onRowMoved}
				rows={tableData.trees}
				onBottomHit={onBottomHit}
				columns={columns}
				createdRow={newRowPath}
				editedRow={editedRowPath}
				getRowEditor={useCallback((props: TableRowEditorProps<Row>) => {
					return RowEditor(props)
				}, [])}
				onEditCompleted={useCallback((e: TableEditCompletedEvent<Row>) => {
					setEditedRowPath(null)
					const row = e.row
					if(!row){
						return
					}

					setTableData(tableData => tableData.updateLeafAt(e.location, () => row.value))
				}, [])}
				onCreateCompleted={useCallback((e: TableEditCompletedEvent<Row>) => {
					setNewRowPath(null)
					const row = e.row
					if(!row){
						return
					}

					setTableData(tableData => tableData.insertLeafAt(e.location, row.value))
				}, [])}
			/>
		</Col>
	)
}

const RowEditor = ({row, onDone}: TableRowEditorProps<Row>) => {
	const [name, setName] = useState(!row ? "" : row.value)
	return (
		<TextInput
			inputRef={useRef<HTMLInputElement | null>(null)}
			value={name}
			onChange={setName}
			onBlur={() => onDone(!name ? null : {value: name})}
		/>
	)
}
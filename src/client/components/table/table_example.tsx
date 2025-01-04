import {isTreeBranch, Tree} from "@nartallax/forest"
import {Button} from "client/components/button/button"
import {Col} from "client/components/row_col/row_col"
import {Table, TableColumnDefinition, TableEditCompletedEvent, TableRowEditorProps, TableRowMoveEvent, TableRowSequenceDesignator} from "client/components/table/table"
import {useTreeTableDataLoader} from "client/components/table/table_data_loader"
import {useTableSettings} from "client/components/table/table_settings"
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
	const pagesTotal = 1

	const [newRowPath, setNewRowPath] = useState<number[] | null>(null)
	const [editedRowPath, setEditedRowPath] = useState<number[] | null>(null)

	const columns = useMemo(() => getColumns(setNewRowPath, setEditedRowPath), [setNewRowPath, setEditedRowPath])

	const [settings, setSettings] = useTableSettings({
		columns,
		areColumnsOrderable: true,
		areColumnsResizeable: true,
		areColumnsSwappable: true,
		maxOrderedColumns: 2,
		localStorageId: "test"
	})

	const {onBottomHit, setTableData, rows} = useTreeTableDataLoader({
		settings,
		loadPage: async evt => {
			// const nums = ["one", "two", "three", "four", "five", "six"]
			const nums = ["one", "two", "three"]
			const nextPageIndex = evt.knownRows.length / nums.length
			if(nextPageIndex >= pagesTotal){
				return
			}
			await new Promise(ok => setTimeout(ok, 100))
			if(evt.parentRow?.value.includes("three")){
				return
			}
			return nums.map(x => {
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
		}
	})

	const onRowMoved = useCallback((evt: TableRowMoveEvent<Row>) => {
		setTableData(forest => forest.moveSeveral(evt.oldLocation.firstRow, evt.newLocation.firstRow, evt.newLocation.count))
	}, [setTableData])

	const [cursor, setCursor] = useState<readonly number[] | null>(null)
	const [selectedRows, setSelectedRows] = useState<TableRowSequenceDesignator | null>(null)

	return (
		<Col margin grow gap>
			<Table<Row>
				rowCursor={cursor}
				setRowCursor={setCursor}
				selectedRows={selectedRows}
				setSelectedRows={setSelectedRows}
				isAutofocused
				settings={settings}
				setSettings={setSettings}
				getRowKey={useCallback((row: Row) => row.value, [])}
				getChildren={useCallback((row: Row) => isTreeBranch(row) ? row.children : null, [])}
				onRowMoved={onRowMoved}
				rows={rows}
				onBottomHit={onBottomHit}
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
				}, [setTableData])}
				onCreateCompleted={useCallback((e: TableEditCompletedEvent<Row>) => {
					setNewRowPath(null)
					const row = e.row
					if(!row){
						return
					}

					setTableData(tableData => tableData.insertLeafAt(e.location, row.value))
				}, [setTableData])}
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
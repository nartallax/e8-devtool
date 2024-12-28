import {TableProps} from "client/components/table/table"
import {reactMemo} from "common/react_memo"
import {useCallback} from "react"
import * as css from "./table.module.css"
import {TableCellBare} from "client/components/table/table_cell"

type Props<T> = {
	row: T | null
	location: readonly number[]
	completeEdit?: TableProps<T>["onEditCompleted"]
} & Pick<TableProps<T>, "columns" | "getRowEditor">

export const TableEditedRow = reactMemo(<T,>({
	row, location, completeEdit, columns, getRowEditor
}: Props<T>) => {

	const onDone = useCallback(async(row: T | null) => {
		if(completeEdit){
			await completeEdit({location, row})
		}
	}, [completeEdit, location])

	const rawEditor = !getRowEditor ? null : getRowEditor({
		location, row, onDone
	})

	if(Array.isArray(rawEditor)){
		return (
			<>
				{columns.map((column, i) => (
					<TableCellBare column={column} key={column.id}>
						{rawEditor[i] ?? null}
					</TableCellBare>
				))}
			</>
		)
	} else {
		return <div className={css.fullWidthEditorRow}>{rawEditor}</div>
	}
})
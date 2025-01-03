import {TableColumnDefinition, TableProps} from "client/components/table/table"
import {reactMemo} from "common/react_memo"
import {useCallback, useState} from "react"
import * as css from "./table.module.css"
import {TableCellBare} from "client/components/table/table_cell"

type Props<T> = {
	row: T | null
	location: readonly number[]
	completeEdit?: TableProps<T>["onEditCompleted"]
	columns: readonly TableColumnDefinition<T>[]
} & Pick<TableProps<T>, "getRowEditor">

export const TableEditedRow = reactMemo(<T,>({
	row, location, completeEdit, columns, getRowEditor
}: Props<T>) => {

	const [isLoading, setLoading] = useState(false)

	const onDone = useCallback(async(row: T | null) => {
		if(completeEdit){
			try {
				setLoading(true)
				await completeEdit({location, row})
			} finally {
				setLoading(false)
			}
		}
	}, [completeEdit, location])

	const rawEditor = !getRowEditor ? null : getRowEditor({
		location, row, onDone, isDisabled: isLoading
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
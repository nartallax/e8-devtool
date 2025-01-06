import {TableColumnDefinition, TableProps} from "client/components/table/table"
import {reactMemo} from "common/react_memo"
import {useCallback, useState} from "react"
import * as css from "./table.module.css"
import {TableCellBare} from "client/components/table/table_cell"
import {TableUtils} from "client/components/table/table_utils"

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

	const ref = useCallback((el: HTMLDivElement | null) => {
		if(el){
			TableUtils.scrollRowIntoView(el, location)
		}
	}, [location])

	if(Array.isArray(rawEditor)){
		return (
			<>
				{columns.map((column, i) => (
					<TableCellBare
						column={column}
						key={column.id}
						editorTreePath={JSON.stringify(location)}
						ref={i === 0 ? ref : undefined}>
						{rawEditor[i] ?? null}
					</TableCellBare>
				))}
			</>
		)
	} else {
		return <div className={css.fullWidthEditorRow} data-editor-tree-path={JSON.stringify(location)} ref={ref}>{rawEditor}</div>
	}
})
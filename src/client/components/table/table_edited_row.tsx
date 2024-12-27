import {TableProps, TableRow} from "client/components/table/table"
import {reactMemo} from "common/react_memo"
import {isValidElement, ReactNode, useCallback} from "react"
import * as css from "./table.module.css"
import {TableUtils} from "client/components/table/table_utils"
import {TableCellBare} from "client/components/table/table_cell"

type Props<K extends string> = {
	row: TableRow<K> | null
	location: readonly number[]
	completeEdit?: TableProps<K>["onEditCompleted"]
} & Pick<TableProps<K>, "columns" | "getRowEditor">

export const TableEditedRow = reactMemo(<K extends string>({
	row, location, completeEdit, columns, getRowEditor
}: Props<K>) => {

	const onDone = useCallback(async(row: TableRow<K> | null) => {
		if(completeEdit){
			await completeEdit({location, row})
		}
	}, [completeEdit, location])

	const rawEditor = !getRowEditor ? null : getRowEditor({
		location, row, onDone
	})

	if(isValidElement(rawEditor)){
		return <div className={css.fullWidthEditorRow}>{rawEditor}</div>
	} else if(!!rawEditor && typeof(rawEditor) === "object"){
		const colMap = rawEditor as {readonly [colId in K]?: ReactNode}
		return (
			<>
				{TableUtils.colIds(columns).map(columnId => (
					<TableCellBare
						key={columnId}
						columnId={columnId}>
						{colMap[columnId] ?? null}
					</TableCellBare>
				))}</>
		)
	} else {
		return null
	}
})
import {TableColumnDefinition} from "client/components/table/table"
import {reactMemo} from "common/react_memo"
import {TableCell} from "client/components/table/table_cell"

type Props<T> = {
	row: T
	columns: readonly TableColumnDefinition<T>[]
}

export const TableRow = reactMemo(<T,>({row, columns}: Props<T>) => {
	return (
		<tr>
			{columns.map((column, index) => <TableCell row={row} render={column.render} key={column.id ?? index}/>)}
		</tr>
	)
})
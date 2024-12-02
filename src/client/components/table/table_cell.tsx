import {reactMemo} from "common/react_memo"

type TableCellProps<T> = {
	row: T
	render: (row: T) => React.ReactNode
}

export const TableCell = reactMemo(<T,>({row, render}: TableCellProps<T>) => {
	return (
		<td>
			{render(row)}
		</td>
	)
})
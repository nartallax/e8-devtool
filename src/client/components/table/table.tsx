import * as css from "./table.module.css"
import {Col, RowColProps, rowColPropsToStyle} from "client/components/row_col/row_col"
import {cn} from "client/ui_utils/classname"
import {TableRow} from "client/components/table/table_row"
import {pick} from "common/pick"
import {omit} from "common/omit"

export type TableColumnDefinition<T> = {
	name?: React.ReactNode
	render: (row: T) => React.ReactNode
	id?: string
	/** CSS expression of this column's width.
	If not specified, will take equal amount of remaining space. */
	width?: string
}

type Props<T> = RowColProps & {
	/** Get key of the row.
	Useful for optimizing re-renders; if not passed, index will be used. */
	getRowKey?: (row: T) => React.Key
	columns: readonly TableColumnDefinition<T>[]
	data: readonly T[]
	/** If false, headers will be hidden. True by default */
	areHeadersVisible?: boolean
}

export const Table = <T,>({
	columns, data, getRowKey, areHeadersVisible = true, ...props
}: Props<T>) => {
	const allColsHaveWidth = columns.every(col => !!col.width)
	// if every single column have width, `table-layout:fixed` will stretch them to fit the table width
	// however, this is counterintuitive because then column width won't be respected - they will grow
	// a way to counter it is to set width to `auto`, disabling `table-layout:fixed`
	const tableStyle = allColsHaveWidth ? {width: "auto"} : rowColPropsToStyle(pick(props, ["width"]))

	return (
		<Col
			{...omit(props, "width")}
			className={cn(css.table, props.className, {
				[css.withHeaders!]: areHeadersVisible
			})}>
			<table style={tableStyle}>
				{areHeadersVisible
				&& <thead>
					{columns.map((col, index) => <th key={col.id ?? index} style={{width: col.width}}>{col.name}</th>)}
				</thead>}
				<tbody>
					{data.map((row, index) => <TableRow row={row} key={getRowKey?.(row) ?? index} columns={columns}/>)}
				</tbody>
			</table>
		</Col>
	)
}

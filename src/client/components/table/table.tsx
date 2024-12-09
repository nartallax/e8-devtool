import * as css from "./table.module.css"
import {Col, RowColProps, rowColPropsToStyle} from "client/components/row_col/row_col"
import {cn} from "client/ui_utils/classname"
import {pick} from "common/pick"
import {omit} from "common/omit"
import {TableSegment} from "client/components/table/table_segment"
import {TableDataSourceDefinition, useTableDataSource} from "client/components/table/table_data_source"

/** A description of a single row in a tree structure */
export type TableHierarchyEntry<T> = {
	row: T
	rowIndex: number
	parentLoadedRowsCount: number
}

/** Hierarchy is a sequence of rows in tree structure, each one is level further, from the root */
export type TableHierarchy<T> = TableHierarchyEntry<T>[]

const emptyArray: any[] = []

export type TableColumnDefinition<T> = {
	name?: React.ReactNode
	render: (renderArgs: {row: T, hierarchy: TableHierarchy<T>}) => React.ReactNode
	id?: string
	/** CSS expression of this column's width.
	If not specified, will take equal amount of remaining space. */
	width?: string
	/** If enabled, cells in this column will have elements to represent tree structure and interact with it */
	isTreeColumn?: boolean
}

type Props<T> = RowColProps & {
	dataSource: TableDataSourceDefinition<T>
	columns: TableColumnDefinition<T>[]
	/** If false, headers will be hidden. True by default */
	areHeadersVisible?: boolean
}


export const Table = <T,>({
	columns, dataSource: dataSourceParams, areHeadersVisible = true, ...props
}: Props<T>) => {
	const allColsHaveWidth = columns.every(col => !!col.width)
	// if every single column have width, `table-layout:fixed` will stretch them to fit the table width
	// however, this is counterintuitive because then column width won't be respected - they will grow
	// a way to counter it is to set width to `auto`, disabling `table-layout:fixed`
	const tableStyle = allColsHaveWidth ? {width: "auto"} : rowColPropsToStyle(pick(props, ["width"]))

	const dataSource = useTableDataSource(dataSourceParams)

	return (
		<Col
			{...omit(props, "width")}
			className={cn(css.table, props.className, {
				[css.withHeaders!]: areHeadersVisible
			})}>
			<table style={tableStyle}>
				{areHeadersVisible
				&& <thead>
					<tr>
						{columns.map((col, index) => <th key={col.id ?? index} style={{width: col.width}}>{col.name}</th>)}
					</tr>
				</thead>}
				<tbody>
					<TableSegment
						hierarchy={emptyArray}
						columns={columns}
						dataSource={dataSource}
					/>
				</tbody>
			</table>
		</Col>
	)
}

import * as css from "./table.module.css"
import {TableSegment} from "client/components/table/table_segment"
import {TableDataSourceDefinition, useTableDataSource} from "client/components/table/table_data_source"
import {useMemo} from "react"
import {cn} from "client/ui_utils/classname"

/** A description of a single row in a tree structure */
export type TableHierarchyEntry<T> = {
	row: T
	rowIndex: number
	parentLoadedRowsCount: number
}

/** Hierarchy is a sequence of rows in tree structure, each one is level further, from the root */
export type TableHierarchy<T> = TableHierarchyEntry<T>[]

const emptyArray: any[] = []

const validateColumnId = (id: string) => {
	if(!/^[a-zA-Z\-_]+$/.test(id)){
		throw new Error(`Incorrect column ID: ${JSON.stringify(id)}`)
	}
}

export type TableColumnDefinition<T> = {
	// TODO: test if uppercase and dashes-underscores work alright here
	/** ID of the column. Must consist of alphabetic characters and dashes/underscores only. */
	id: string
	header?: React.ReactNode
	render: (renderArgs: {row: T, hierarchy: TableHierarchy<T>}) => React.ReactNode
	/** CSS expression of this column's width. Can use `fr` units and also `auto` keyword. See grid sizing.
	If not specified, will default to `auto`. */
	width?: string
	/** If enabled, cells in this column will have elements to represent tree structure and interact with it */
	isTreeColumn?: boolean
}

type Props<T> = {
	dataSource: TableDataSourceDefinition<T>
	columns: TableColumnDefinition<T>[]
	/** If false, headers will be hidden. True by default */
	areHeadersVisible?: boolean
}


export const Table = <T,>({
	columns, dataSource: dataSourceParams, areHeadersVisible = true
}: Props<T>) => {
	const dataSource = useTableDataSource(dataSourceParams)

	const tableStyle = useMemo(() => {
		const tableVars = Object.fromEntries(columns.map((col, i) => {
			validateColumnId(col.id)
			return [`--table-col-${col.id}`, `${i + 1} / ${i + 2}`]
		}))

		return {
			gridTemplateColumns: columns.map(col => col.width ?? "auto").join(" "),
			...tableVars
		}
	}, [columns])


	return (
		<div className={cn(css.table, {[css.withHeaders!]: areHeadersVisible})} style={tableStyle}>
			<TableSegment
				hierarchy={emptyArray}
				columns={columns}
				dataSource={dataSource}
			/>
			{/* Headers should appear after actual cells; that way they are drawn over absolutely positioned elements within cells
			(yes, I could just use z-index, but it has potential to cause more problems down the line than it solves, so I'd rather not) */}
			{areHeadersVisible
				&& <>
					{columns.map(col => (
						<div
							className={css.tableHeader}
							key={col.id}
							style={{
								gridColumn: `var(--table-col-${col.id})`,
								gridRow: "1 / 2"
							}}>
							{col.header}
						</div>
					))}
				</>}
		</div>
	)
}

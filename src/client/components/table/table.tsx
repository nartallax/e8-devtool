import * as css from "./table.module.css"
import {Col, RowColProps, rowColPropsToStyle} from "client/components/row_col/row_col"
import {cn} from "client/ui_utils/classname"
import {TableRow} from "client/components/table/table_row"
import {pick} from "common/pick"
import {omit} from "common/omit"
import {useCallback, useRef, useState} from "react"
import {TableInfiniteScroll} from "client/components/table/table_infinite_scroll"

export type TableColumnDefinition<T> = {
	name?: React.ReactNode
	render: (row: T) => React.ReactNode
	id?: string
	/** CSS expression of this column's width.
	If not specified, will take equal amount of remaining space. */
	width?: string
}

type Props<T> = RowColProps & (LoadDataProps<T> | PreloadedDataProps<T>) & {
	/** Get key of the row.
	Useful for optimizing re-renders; if not passed, index will be used. */
	getRowKey?: (row: T) => React.Key
	columns: TableColumnDefinition<T>[]
	/** If false, headers will be hidden. True by default */
	areHeadersVisible?: boolean
}

export type TableDataLoadOptions<T> = {
	/** Previous row in the sequence of row. Null if this call is supposed to load first row. */
	previousRow: T | null
	/** Amount of rows already present in the sequence*/
	offset: number
}

type PromiseOrNot<T> = T | Promise<T>

type DataLoadResult<T> = PromiseOrNot<T[] | {
	data: T[]
	isThereMore: boolean
}>

type LoadDataProps<T> = {
	loadData: (opts: TableDataLoadOptions<T>) => DataLoadResult<T>
}

type PreloadedDataProps<T> = {
	data: T[]
}

const isPreloadedDataProps = <T,>(props: LoadDataProps<T> | PreloadedDataProps<T>): props is PreloadedDataProps<T> => {
	const key: keyof PreloadedDataProps<T> = "data"
	return key in props
}

export const Table = <T,>({
	columns, getRowKey, areHeadersVisible = true, ...props
}: Props<T>) => {
	const allColsHaveWidth = columns.every(col => !!col.width)
	// if every single column have width, `table-layout:fixed` will stretch them to fit the table width
	// however, this is counterintuitive because then column width won't be respected - they will grow
	// a way to counter it is to set width to `auto`, disabling `table-layout:fixed`
	const tableStyle = allColsHaveWidth ? {width: "auto"} : rowColPropsToStyle(pick(props, ["width"]))

	const [knownRows, setKnownRows] = useState(isPreloadedDataProps(props) ? props.data : [])
	const knownRowsRef = useRef(knownRows)
	knownRowsRef.current = knownRows

	const loadData = isPreloadedDataProps(props) ? null : props.loadData
	const loadNextRows = useCallback(async() => {
		if(!loadData){
			return false // it shouldn't be called at all in this case, but whatever
		}

		const knownRows = knownRowsRef.current
		const opts: TableDataLoadOptions<T> = {
			offset: knownRows.length,
			previousRow: knownRows[knownRows.length - 1] ?? null
		}

		const nextPage = await Promise.resolve(loadData(opts))
		let data: T[]
		let isThereMore: boolean
		if(Array.isArray(nextPage)){
			data = nextPage
			// we cannot rely on the fact that page size from data source will be consistent
			// it probably will be, but the only way to know for sure if all data is loaded is to wait for empty page
			isThereMore = nextPage.length > 0
		} else {
			data = nextPage.data
			isThereMore = nextPage.isThereMore
		}

		setKnownRows(knownRows => [...knownRows, ...data])
		return isThereMore
	}, [loadData])

	const rows = knownRows.map((row, index) => <TableRow row={row} key={getRowKey?.(row) ?? index} columns={columns}/>)

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
					{loadData ? <TableInfiniteScroll onBottomHit={loadNextRows} offset={50}>{rows}</TableInfiniteScroll> : rows}
				</tbody>
			</table>
		</Col>
	)
}

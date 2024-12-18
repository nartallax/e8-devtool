import {Col} from "client/components/row_col/row_col"
import {Table, TableColumnDefinition} from "client/components/table/table"
import {TableDataLoadOptions, TableDataSourceDefinition} from "client/components/table/table_data_source"
import {useMemo} from "react"

export const TableExample = () => {
	const pagesTotal = 2
	const dataSource: TableDataSourceDefinition<string> = useMemo(() => ({
		getRowKey: row => row,
		loadData: async(opts: TableDataLoadOptions<string>) => {
			await new Promise(ok => setTimeout(ok, 1000))
			// const data = ["one", "two", "three", "four", "five", "six"]
			const data = ["one"]
			const nextPageIndex = opts.offset / data.length
			if(nextPageIndex >= pagesTotal){
				return []
			}
			return data.map(x => (opts.parent ?? "") + " " + nextPageIndex + " " + x)
		},
		canHaveChildren: row => ((row.length % 2) === 1),
		onRowMoved: evt => {
			console.log("move happened", evt)
		}
	}), [])


	return (
		<Col margin grow>
			<Table
				areColumnsOrderable
				maxOrderedColumns={2}
				dataSource={dataSource}
				columns={useMemo<TableColumnDefinition<string>[]>(() => [
					{
						id: "length", header: "length", width: "75px", render: x => x.row.length
					},
					{
						id: "name", header: "name", width: "1fr", render: x => x.row, isTreeColumn: true
					},
					{
						id: "length_and_Name", header: "length + name", width: "2fr", render: x => x.row.length + " " + x.row
					}
				], [])}
			/>
		</Col>
	)
}
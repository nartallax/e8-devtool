import {Col} from "client/components/row_col/row_col"
import {Table, TableColumnDefinition} from "client/components/table/table"
import {TableDataLoadOptions, TableDataSourceDefinition} from "client/components/table/table_data_source"
import {useMemo} from "react"

export const TableExample = () => {
	const pagesTotal = 3
	const dataSource: TableDataSourceDefinition<string> = useMemo(() => ({
		getRowKey: row => row,
		loadData: async(opts: TableDataLoadOptions<string>) => {
			await new Promise(ok => setTimeout(ok, 100))
			const data = ["one", "two", "three", "four", "five", "six"]
			const nextPageIndex = opts.offset / data.length
			if(nextPageIndex >= pagesTotal){
				return []
			}
			return data.map(x => (opts.parent ?? "") + " " + nextPageIndex + " " + x)
		},
		canHaveChildren: row => ((row.length % 2) === 1)
	}), [])


	return (
		<Col margin grow>
			<Table
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

	/*
	return (
		<div style={{
			display: "grid",
			gridTemplateColumns: "1fr 100px 1fr",
			gridAutoFlow: "row dense",
			"--first-col": "1 / 2",
			"--second-col": "2 / 3",
			"--third-col": "3 / 4"
		} as any}>
			<div style={{gridColumn: "var(--second-col)"}}>second col</div>
			<div style={{gridColumn: "var(--first-col)"}}>first col</div>
			<div style={{gridColumn: "var(--third-col)"}}>third col</div>
			<div style={{gridColumn: "var(--third-col)"}}>third col</div>
			<div style={{gridColumn: "var(--first-col)"}}>
				first col
				<br/>
				uwu
			</div>
			<div style={{gridColumn: "var(--second-col)"}}>second col</div>
			<div style={{gridColumn: "var(--first-col)"}}>first col</div>
			<div style={{gridColumn: "var(--second-col)"}}>second col</div>
			<div style={{gridColumn: "var(--third-col)"}}>third col</div>
		</div>
	)
	*/

}
import {Table, TableColumnDefinition} from "client/components/table/table"
import {TableDataLoadOptions, TableDataSourceDefinition} from "client/components/table/table_data_source"
import {useMemo} from "react"

export const TableExample = () => {
	const pagesTotal = 10
	const dataSource: TableDataSourceDefinition<string> = useMemo(() => ({
		loadData: async(opts: TableDataLoadOptions<string>) => {
			await new Promise(ok => setTimeout(ok, 100))
			let data = ["one", "two", "three"]
			for(let x = 0; x < 1; x++){
				data = [...data, ...data]
			}
			const nextPageIndex = opts.offset / data.length
			if(nextPageIndex >= pagesTotal){
				return []
			}
			return data.map(x => (opts.parent ?? "") + " " + nextPageIndex + " " + x)
		},
		canHaveChildren: row => ((parseInt(row.charAt(1)) % 2) === 1)
	}), [])


	return (
		<Table
			dataSource={dataSource}
			columns={useMemo<TableColumnDefinition<string>[]>(() => [
				{name: "length", width: "75px", render: x => x.row.length},
				{name: "name", render: x => x.row, isTreeColumn: true},
				{name: "length + name", width: "150px", render: x => x.row.length + " " + x.row}
			], [])}
			margin
		/>
	)

}
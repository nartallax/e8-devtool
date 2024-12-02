import {Table, TableColumnDefinition, TableDataLoadOptions} from "client/components/table/table"
import {useCallback, useMemo} from "react"

export const TableExample = () => {

	const pagesTotal = 10
	const loadNextPage = useCallback((opts: TableDataLoadOptions<string>) => {
		let data = ["one", "two", "three"]
		for(let x = 0; x < 1; x++){
			data = [...data, ...data]
		}
		const nextPageIndex = opts.offset / data.length
		if(nextPageIndex >= pagesTotal){
			return []
		}
		return data.map(x => nextPageIndex + " " + x)
	}, [])


	return (
		<Table
			loadData={loadNextPage}
			areHeadersVisible
			columns={useMemo<TableColumnDefinition<string>[]>(() => [
				{name: "length", width: "75px", render: x => x.length},
				{name: "name", render: x => x},
				{name: "length + name", width: "150px", render: x => x.length + " " + x}
			], [])}
			margin
		/>
	)

}
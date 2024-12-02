import {Table} from "client/components/table/table"
import {useMemo} from "react"

export const TableExample = () => {

	const data = useMemo(() => {
		let data = ["one", "two", "three"]
		for(let x = 0; x < 1; x++){
			data = [...data, ...data]
		}
		return data
	}, [])


	return (
		<Table
			data={data}
			areHeadersVisible
			width="110vw"
			columns={[
				{name: "length", width: "75px", render: x => x.length},
				{name: "name", render: x => x},
				{name: "length + name", width: "150px", render: x => x.length + " " + x}
			]}
			margin
		/>
	)

}
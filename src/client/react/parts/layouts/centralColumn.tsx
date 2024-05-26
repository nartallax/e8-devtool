import {Col} from "client/react/components/rowCol/rowCol"
import {PropsWithChildren} from "react"

export const CentralColumn = ({children}: PropsWithChildren) => {
	return (
		<Col
			width="100%"
			padding
			align="center"
			grow={1}>
			<Col
				width={["400px", "50vw", "800px"]}
				grow={1}
				align="stretch"
				gap>
				{children}
			</Col>
		</Col>
	)
}
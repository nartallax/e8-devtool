import {Col} from "client/components/row_col/row_col"
import {MinMaxableSize} from "client/ui_utils/sizes"
import {PropsWithChildren} from "react"

type Props = {
	width?: MinMaxableSize
}

export const CentralColumn = ({children, width}: PropsWithChildren<Props>) => {
	return (
		<Col
			width="100%"
			padding
			align="center"
			grow={1}>
			<Col
				width={width ?? ["400px", "50vw", "800px"]}
				grow={1}
				align="stretch"
				gap>
				{children}
			</Col>
		</Col>
	)
}
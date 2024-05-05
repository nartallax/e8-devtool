import {Col, ContainerProps, Row} from "client/component/row_col/row_col"
import * as css from "./two_column_layout.module.scss"
import {HTMLChildArray} from "@nartallax/cardboard-dom"

interface Props extends ContainerProps {
	readonly foregroundChildren?: HTMLChildArray
	readonly backgroundChildren?: HTMLChildArray
}

export const TwoColumnLayout = (props: Props) => {
	return Row({align: "stretch", ...props}, [
		Col({
			class: css.foregroundColumn,
			padding: true,
			grow: 0,
			justify: "start",
			align: "stretch"
		}, props.foregroundChildren ?? []),
		Col({grow: 1, align: "stretch"}, props.backgroundChildren ?? [])
	])
}
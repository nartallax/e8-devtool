import {Col, Row} from "client/react/components/rowCol/rowCol"
import {PropsWithChildren, isValidElement} from "react"
import * as css from "./sidebarLayout.module.scss"

export const SidebarLayout = ({children}: PropsWithChildren) => {
	const childArr: React.ReactNode[] = !children ? [] : Array.isArray(children) ? children : [children]
	const sidebar = childArr.find(child => isValidElement(child) && child.type === Sidebar)
	const notSidebarChildren = childArr.filter(child => child !== sidebar)
	return (
		<Row grow stretch>
			{sidebar}
			<Col justify="start" stretch grow>
				{notSidebarChildren}
			</Col>
		</Row>
	)
}

/** This is just a part of <SidebarLayout> and should not be used separately */
export const Sidebar = ({children}: PropsWithChildren) => (
	<Col
		justify="start"
		stretch
		className={css.sidebarSide}
		gap
		padding>
		{children}
	</Col>
)

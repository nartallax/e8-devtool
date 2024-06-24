import {Col, Row} from "client/components/row_col/row_col"
import {PropsWithChildren, forwardRef, isValidElement} from "react"
import * as css from "./sidebar_layout.module.scss"

export const SidebarLayout = forwardRef<HTMLDivElement, PropsWithChildren>(({children}, ref) => {
	const childArr: React.ReactNode[] = !children ? [] : Array.isArray(children) ? children : [children]
	const sidebar = childArr.find(child => isValidElement(child) && child.type === Sidebar)
	const notSidebarChildren = childArr.filter(child => child !== sidebar)
	return (
		<Row grow stretch ref={ref}>
			{sidebar}
			<Col justify="start" stretch grow>
				{notSidebarChildren}
			</Col>
		</Row>
	)
})

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

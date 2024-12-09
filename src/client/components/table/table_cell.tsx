import {TableColumnDefinition, TableHierarchy} from "client/components/table/table"
import {reactMemo} from "common/react_memo"
import * as css from "./table.module.css"
import {cn} from "client/ui_utils/classname"
import {SetState} from "client/ui_utils/react_types"
import {Icon} from "generated/icons"

type TableCellProps<T> = TreeTableCellProps<T> & {
	column: TableColumnDefinition<T>
}

type TreeTableCellProps<T> = {
	hierarchy: TableHierarchy<T>
	isExpanded: boolean
	setExpanded: SetState<boolean> | null
}

export const TableCell = reactMemo(<T,>({
	hierarchy, column, ...props
}: TableCellProps<T>) => {

	/*
type SquareName = "vertical" | "split" | "corner" | "empty"
const squaresBase: SquareName[] | undefined = !squares
		? undefined
		: squares
			.map(square => square === "corner" ? "empty" : square === "split" ? "vertical" : square)
	const squaresCap: SquareName[] | undefined = !squaresBase ? undefined : [...squaresBase, "corner"]
	const squaresMiddle: SquareName[] | undefined = !squaresBase ? undefined : [...squaresBase, "split"]
	*/

	return (
		<div
			className={cn(css.tableCell, {[css.noPadding!]: column.isTreeColumn})}
			style={{gridColumn: `var(--table-col-${column.id})`}}>
			{column.isTreeColumn && <TableCellTreeControls {...props} hierarchy={hierarchy}/>}
			{column.render({
				row: hierarchy[hierarchy.length - 1]!.row,
				hierarchy
			})}
		</div>
	)
})

const TableCellTreeControls = reactMemo(<T,>({isExpanded, setExpanded, hierarchy}: TreeTableCellProps<T>) => {
	return (
		<div className={cn(css.treeControls, {
			[css.isExpanded!]: isExpanded
		})}>{
				hierarchy.map((entry, index) => {
					const isLast = entry.rowIndex === entry.parentLoadedRowsCount
					const isPrevLevel = index === hierarchy.length - 2
					const isCurrentLevel = index === hierarchy.length - 1
					const isRoot = hierarchy.length === 1
					const canHaveChildren = !!setExpanded
					const isExpander = isCurrentLevel && canHaveChildren
					const variant
						= isExpander ? "expander" as const
							: isCurrentLevel && !isRoot && !canHaveChildren ? "horisontal" as const
								: isPrevLevel && !isLast ? "split" as const
									: isPrevLevel && isLast ? "corner" as const
										: !isPrevLevel && !isCurrentLevel && !isLast ? "vertical" as const
											: "empty" as const
					const onClick = !isExpander ? undefined : (() => {
						setExpanded(expanded => !expanded)
					})
					return (
						<div key={index} onClick={onClick} className={cn(css[variant], isExpander ? Icon.triangleRight : undefined)}/>
					)
				})
			}</div>
	)
})
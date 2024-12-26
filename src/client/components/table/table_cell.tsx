import {TableColumnDefinition, TableHierarchy} from "client/components/table/table"
import {reactMemo} from "common/react_memo"
import * as css from "./table.module.css"
import {cn} from "client/ui_utils/classname"
import {SetState} from "client/ui_utils/react_types"
import {Icon} from "generated/icons"

type TableCellProps<K extends string> = TreeTableCellProps<K> & {
	column: TableColumnDefinition
	columnId: K
	isRowCurrentlyDragged: boolean
}

type TreeTableCellProps<K extends string> = {
	hierarchy: TableHierarchy<K>
	isExpanded: boolean
	setExpanded: SetState<boolean> | null
}

export const TableCell = reactMemo(<K extends string>({
	hierarchy, columnId, column, isRowCurrentlyDragged, ...props
}: TableCellProps<K>) => {
	return (
		<div
			data-tree-path={JSON.stringify(hierarchy.map(entry => entry.rowIndex))}
			className={cn(css.tableCell, {
				[css.movedRowCell!]: isRowCurrentlyDragged
			})}
			style={{gridColumn: `var(--table-col-${columnId})`}}>
			{column.isTreeColumn && <TableCellTreeControls {...props} hierarchy={hierarchy}/>}
			{hierarchy[hierarchy.length - 1]!.row[columnId]}
		</div>
	)
})

const TableCellTreeControls = reactMemo(<K extends string>({isExpanded, setExpanded, hierarchy}: TreeTableCellProps<K>) => {
	const lastHierarchyEntry = hierarchy[hierarchy.length - 1]!
	const isRowLastInSequence = lastHierarchyEntry.rowIndex === lastHierarchyEntry.parentLoadedRowsCount - 1
	return (
		<div className={cn(css.treeControls, {
			[css.isExpanded!]: isExpanded
		})}>{
				hierarchy.map((_, index) => {
					const isParentLevel = index === hierarchy.length - 2
					const isCurrentLevel = index === hierarchy.length - 1
					const nextEntry = hierarchy[index + 1]
					const isNextEntryLastInSequence = !!nextEntry && nextEntry.rowIndex === nextEntry.parentLoadedRowsCount - 1
					const isRoot = hierarchy.length === 1
					const canHaveChildren = !!setExpanded
					const isExpander = isCurrentLevel && canHaveChildren
					if(isExpander){
						return (
							<button
								key={index}
								type="button"
								className={cn(css.expander, Icon.triangleRight)}
								onClick={() => {
									setExpanded(expanded => !expanded)
								}}
							/>
						)
					} else {
						const variant
							= isCurrentLevel && !isRoot && !canHaveChildren ? "horisontal" as const
								: isParentLevel && !isRowLastInSequence ? "split" as const
									: isParentLevel && isRowLastInSequence ? "corner" as const
										: !isParentLevel && !isCurrentLevel && !isNextEntryLastInSequence ? "vertical" as const
											: "empty" as const
						return <div key={index} className={css[variant]}/>
					}
				})
			}</div>
	)
})
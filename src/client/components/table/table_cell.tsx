import {TableColumnDefinition, TableHierarchy} from "client/components/table/table"
import {reactMemo} from "common/react_memo"
import * as css from "./table.module.css"
import {cn} from "client/ui_utils/classname"
import {SetState} from "client/ui_utils/react_types"
import {PropsWithChildren} from "react"
import {resolveDefaultableSideSize} from "client/ui_utils/sizes"

type TableCellBareProps<T> = {
	column: TableColumnDefinition<T>
	treePath?: string
	isRowCurrentlyDragged?: boolean
	isSelected?: boolean
	isOnCursor?: boolean
}

type TableCellProps<T> = TreeTableCellProps<T> & {
	column: TableColumnDefinition<T>
	isRowCurrentlyDragged: boolean
	isSelected: boolean
	isOnCursor: boolean
}

type TreeTableCellProps<T> = {
	hierarchy: TableHierarchy<T>
	isExpanded: boolean
	setExpanded: SetState<boolean> | null
}

export const TableCell = reactMemo(<T,>({
	hierarchy, column, isRowCurrentlyDragged, isSelected, isOnCursor, ...props
}: TableCellProps<T>) => {
	return (
		<TableCellBare
			treePath={JSON.stringify(hierarchy.map(entry => entry.rowIndex))}
			column={column}
			isRowCurrentlyDragged={isRowCurrentlyDragged}
			isSelected={isSelected}
			isOnCursor={isOnCursor}>
			{column.isTreeColumn && <TableCellTreeControls {...props} hierarchy={hierarchy}/>}
			{column.render({row: hierarchy[hierarchy.length - 1]!.row, hierarchy})}
		</TableCellBare>
	)
})

export const TableCellBare = reactMemo(<T,>({
	column, children, treePath, isRowCurrentlyDragged, isSelected, isOnCursor
}: PropsWithChildren<TableCellBareProps<T>>) => {
	return (
		<div
			data-tree-path={treePath}
			className={cn(css.tableCell, {
				[css.movedRowCell!]: isRowCurrentlyDragged,
				[css.selectedRowCell!]: isSelected,
				[css.cursoredRowCell!]: isOnCursor
			})}
			style={{
				gridColumn: `var(--table-col-${column.id})`,
				padding: !column.padding ? undefined : resolveDefaultableSideSize(column.padding)
			}}>
			{children}
		</div>
	)
})

const TableCellTreeControls = reactMemo(<T,>({isExpanded, setExpanded, hierarchy}: TreeTableCellProps<T>) => {
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
								className={css.expander}
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
import {Tree, TreeBranch, TreePath, areTreePathsEqual, isTreeBranch} from "common/tree"

import * as css from "./treeView.module.scss"
import {useState} from "react"
import {cn} from "client/react/uiUtils/classname"
import {Icon} from "generated/icons"
import {InlineTreeElementEditor} from "client/react/components/treeView/inlineTreeElementEditor"
import React = require("react")
import {Button} from "client/react/components/button/button"
import {SetState} from "client/react/uiUtils/setState"
import {isInButton} from "client/react/uiUtils/domQueries"

type BaseProps<L, B> = {
	// eslint-disable-next-line react/no-unused-prop-types
	readonly getBranchKey: (branch: B) => string
	// eslint-disable-next-line react/no-unused-prop-types
	readonly getLeafKey: (leaf: L) => string
	readonly getBranchLabel: (branch: B) => string
	readonly getLeafLabel: (leaf: L) => string
	readonly onLeafDoubleclick?: (leaf: L) => void
	readonly squares?: SquareName[]
	// eslint-disable-next-line react/no-unused-prop-types
	readonly path: TreePath
	readonly inlineEditPath: TreePath | null
	readonly canEditBranchLabel: boolean
	readonly canEditLeafLabel: boolean
	readonly onLabelEditComplete: (path: TreePath, tree: Tree<L, B>, newLabel: string | null) => void
	readonly setInlineEditPath: SetState<TreePath | null>
	readonly onNodeDelete: (path: TreePath, tree: Tree<L, B>) => void
	readonly canDeleteLeaf: boolean
	readonly canDeleteBranch: boolean
}

type SquareName = "vertical" | "split" | "corner" | "empty"

type BranchProps<L, B> = BaseProps<L, B> & {
	readonly branch: TreeBranch<L, B>
}

type RowProps<L, B> = BaseProps<L, B> & {
	readonly row: Tree<L, B>
	readonly isExpanded?: boolean
	readonly onExpandChange?: () => void
}

export type TreeBranchChildrenProps<L, B> = BaseProps<L, B> & {
	readonly tree: readonly Tree<L, B>[]
}

const TreeBranch = <T, B>({branch, ...props}: BranchProps<T, B>) => {
	const [isExpanded, setExpanded] = useState(false)

	return (
		<>
			<TreeRow
				row={branch}
				{...props}
				isExpanded={isExpanded}
				onExpandChange={() => setExpanded(exp => !exp)}/>
			{!!isExpanded && <div className={css.treeChildrenWrap}>
				<TreeBranchChildren
					{...props}
					squares={props.squares ?? []}
					tree={branch.children}/>
			</div>}
		</>
	)
}

const TreeRow = <T, B>({
	row, squares, isExpanded, getBranchLabel, getLeafLabel, onExpandChange, onLeafDoubleclick, path, inlineEditPath, onLabelEditComplete, canEditBranchLabel, canEditLeafLabel, setInlineEditPath, onNodeDelete, canDeleteBranch, canDeleteLeaf
}: RowProps<T, B>) => {
	const isInlineEdited = !!inlineEditPath && areTreePathsEqual(path, inlineEditPath)
	const label = isTreeBranch(row) ? getBranchLabel(row.value) : getLeafLabel(row.value)
	let labelOrEditor: React.ReactNode
	if(isInlineEdited){
		labelOrEditor = <InlineTreeElementEditor initialValue={label} onComplete={label => onLabelEditComplete(path, row, label)}/>
	} else {
		labelOrEditor = <div className={css.rowLabel}>{label}</div>
	}

	const buttons: React.ReactNode[] = []

	const canEdit = !!(isTreeBranch(row) ? canEditBranchLabel : canEditLeafLabel)
	if(canEdit){
		buttons.push(<Button
			variant="plain-icon"
			icon={Icon.pencil}
			onClick={() => setInlineEditPath(path)}
			key="edit"/>)
	}

	const canDelete = !!(isTreeBranch(row) ? canDeleteBranch : canDeleteLeaf)
	if(canDelete){
		buttons.push(<Button
			variant="plain-icon"
			icon={Icon.close}
			onClick={() => onNodeDelete(path, row)}
			holdTimeUntilAction={500}
			key="delete"/>)
	}

	const buttonsEl = buttons.length === 0 ? null : <div className={css.rowButtons}>{buttons}</div>


	if(isTreeBranch(row)){
		const onRowClick = (e: React.MouseEvent) => {
			if(shouldHandleRowClick(e)){
				onExpandChange?.()
			}
		}

		return (
			<div className={cn(css.treeRow, {[css.isExpanded!]: isExpanded})} onClick={onRowClick}>
				<TreeRowSquares squares={squares ?? []} endsWith="expander"/>
				{labelOrEditor}
				{buttonsEl}
			</div>
		)
	} else {
		const onRowDblClick = (e: React.MouseEvent) => {
			if(shouldHandleRowClick(e)){
				onLeafDoubleclick?.(row.value)
			}
		}

		return (
			<div className={css.treeRow} onDoubleClick={onRowDblClick}>
				{!squares
					? <TreeRowSquares squares={["empty"]}/>
					: <TreeRowSquares squares={squares} endsWith="horisontal"/>}
				{labelOrEditor}
				{buttonsEl}
			</div>
		)
	}
}

// sometimes we don't want to handle click on row if it lands on other button/input
const shouldHandleRowClick = (e: React.MouseEvent): boolean => {
	return !(e.target instanceof HTMLElement) || (!isInButton(e.target) && e.target.tagName !== "INPUT")
}

const TreeRowSquares = ({squares, endsWith}: {readonly squares: SquareName[], readonly endsWith?: "expander" | "horisontal"}) => {
	return (
		<div className={css.branchSquareContainer}>
			{squares.map((square, i) => {
				switch(square){
					case "corner": return <BranchSquareCorner key={i}/>
					case "vertical": return <BranchSquareVertical key={i}/>
					case "split": return <BranchSquareSplit key={i}/>
					case "empty": return <BranchSquareEmpty key={i}/>
				}
			})}
			{endsWith === "expander" ? <BranchSquareExpander/> : endsWith === "horisontal" ? <BranchSquareHorisontal/> : null}
		</div>
	)
}

const BranchSquareEmpty = () => <div className={css.branchEmpty}/>
const BranchSquareHorisontal = () => <div className={css.branchHorisontal}/>
const BranchSquareVertical = () => <div className={css.branchVertical}/>
const BranchSquareCorner = () => <div className={css.branchCorner}/>
const BranchSquareSplit = () => <div className={css.branchSplit}/>
const BranchSquareExpander = () => <div className={cn(css.branchExpander, Icon.triangleRight)}/>

export const TreeBranchChildren = <T, B>({tree, squares, path, ...props}: TreeBranchChildrenProps<T, B>) => {
	const {getBranchKey, getLeafKey} = props
	const squaresBase: SquareName[] | undefined = !squares
		? undefined
		: squares
			.map(square => square === "corner" ? "empty" : square === "split" ? "vertical" : square)
	const squaresCap: SquareName[] | undefined = !squaresBase ? undefined : [...squaresBase, "corner"]
	const squaresMiddle: SquareName[] | undefined = !squaresBase ? undefined : [...squaresBase, "split"]
	return (
		<>
			{tree.map((tree, i, arr) => {
				const squares = (i === arr.length - 1 ? squaresCap : squaresMiddle)
				const newPath = [...path, i]
				if(isTreeBranch(tree)){
					return (
						<TreeBranch
							branch={tree}
							key={getBranchKey(tree.value)}
							squares={squares}
							path={newPath}
							{...props}/>
					)
				} else {
					return (
						<TreeRow
							row={tree}
							key={getLeafKey(tree.value)}
							squares={squares}
							path={newPath}
							{...props}/>
					)
				}
			})}
		</>
	)
}
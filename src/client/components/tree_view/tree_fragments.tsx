import {Tree, TreeBranch, TreePath, areTreePathsEqual, isTreeBranch} from "common/tree"

import * as css from "./tree_view.module.scss"
import {useState} from "react"
import {cn} from "client/ui_utils/classname"
import {Icon} from "generated/icons"
import {InlineTreeElementEditor} from "client/components/tree_view/inline_tree_element_editor"
import React = require("react")
import {Button} from "client/components/button/button"
import {SetState} from "client/ui_utils/react_types"
import {isInButton} from "client/ui_utils/dom_queries"
import {ValidatorsMaybeFactory} from "client/components/form/validators"

type BaseProps<L, B> = {
	// eslint-disable-next-line react/no-unused-prop-types
	getBranchKey?: (branch: B, path: TreePath, node: Tree<L, B>) => string
	// eslint-disable-next-line react/no-unused-prop-types
	getLeafKey: (leaf: L, path: TreePath, node: Tree<L, B>) => string
	getBranchLabel?: (branch: B, path: TreePath, node: Tree<L, B>) => string
	getBranchSublabel?: (leaf: B, path: TreePath, node: Tree<L, B>) => string
	getLeafLabel: (leaf: L, path: TreePath, node: Tree<L, B>) => string
	getLeafSublabel?: (leaf: L, path: TreePath, node: Tree<L, B>) => React.ReactNode
	onLeafClick?: (leaf: L, path: TreePath) => void
	onLeafDoubleclick?: (leaf: L, path: TreePath) => void
	onBranchClick?: (branch: B, path: TreePath) => void
	onBranchDoubleclick?: (branch: B, path: TreePath) => void
	onAddChild?: (parentPath: TreePath) => void
	squares?: SquareName[]
	// eslint-disable-next-line react/no-unused-prop-types
	path: TreePath
	inlineEditPath: TreePath | null
	canEditBranchLabel: boolean
	canEditLeafLabel: boolean
	onLabelEditComplete: (path: TreePath, tree: Tree<L, B>, newLabel: string | null) => void
	setInlineEditPath: SetState<TreePath | null>
	onNodeDelete: (path: TreePath, tree: Tree<L, B>) => void
	canDeleteLeaf: boolean
	canDeleteBranch: boolean
	leafLabelValidators?: ValidatorsMaybeFactory<string, TreePath>
	branchLabelValidators?: ValidatorsMaybeFactory<string, TreePath>
	selectedPath?: TreePath
	// eslint-disable-next-line react/no-unused-prop-types
	isEverythingExpanded?: boolean
	InlineEditor?: (props: {initialValue: string, onComplete: (newValue: string | null) => void, treePath: TreePath, validators?: ValidatorsMaybeFactory<string, TreePath>}) => React.ReactNode
}

type SquareName = "vertical" | "split" | "corner" | "empty"

type BranchProps<L, B> = BaseProps<L, B> & {
	branch: TreeBranch<L, B>
}

type RowProps<L, B> = BaseProps<L, B> & {
	row: Tree<L, B>
	isExpanded?: boolean
	onExpandChange?: () => void
}

export type TreeBranchChildrenProps<L, B> = BaseProps<L, B> & {
	tree: Tree<L, B>[]
}

const TreeBranch = <T, B>({branch, isEverythingExpanded, ...props}: BranchProps<T, B>) => {
	const [isExpanded, setExpanded] = useState(false)
	const isEffectiveExpanded = isExpanded || isEverythingExpanded

	return (
		<>
			<TreeRow
				row={branch}
				{...props}
				isExpanded={isEffectiveExpanded}
				onExpandChange={() => setExpanded(exp => !exp)}
			/>
			{!!isEffectiveExpanded && <div className={css.treeChildrenWrap}>
				<TreeBranchChildren
					{...props}
					squares={props.squares ?? []}
					tree={branch.children}
				/>
			</div>}
		</>
	)
}

const TreeRow = <T, B>({
	row, squares, isExpanded, getBranchLabel, getLeafLabel, getLeafSublabel, getBranchSublabel,
	onExpandChange, onLeafDoubleclick, onLeafClick, path, inlineEditPath, onLabelEditComplete,
	canEditBranchLabel, canEditLeafLabel, setInlineEditPath, onNodeDelete, onAddChild, canDeleteBranch,
	canDeleteLeaf, leafLabelValidators, branchLabelValidators, selectedPath, InlineEditor = InlineTreeElementEditor,
	onBranchClick, onBranchDoubleclick
}: RowProps<T, B>) => {
	const isSelected = !!selectedPath && areTreePathsEqual(selectedPath, path)
	const isInlineEdited = !!inlineEditPath && areTreePathsEqual(path, inlineEditPath)
	let label: string
	if(isTreeBranch(row)){
		if(!getBranchLabel){
			throw new Error("Cannot get branch label: no function provided.")
		}
		label = getBranchLabel(row.value, path, row)
	} else {
		label = getLeafLabel(row.value, path, row)
	}
	let labelOrEditor: React.ReactNode
	if(isInlineEdited){
		labelOrEditor = (
			<InlineEditor
				initialValue={label}
				onComplete={label => onLabelEditComplete(path, row, label)}
				treePath={path}
				validators={isTreeBranch(row) ? branchLabelValidators : leafLabelValidators}
			/>
		)
	} else {
		const sublabel = isTreeBranch(row) ? getBranchSublabel?.(row.value, path, row) : getLeafSublabel?.(row.value, path, row)

		labelOrEditor = (
			<div className={css.rowLabel}>
				{label}
				{!!sublabel && <span className={css.rowSublabel}>{sublabel}</span>}
			</div>
		)
	}

	const buttons: React.ReactNode[] = []

	if(isTreeBranch(row) && onAddChild){
		buttons.push(<Button
			variant="plain-icon"
			icon={Icon.plus}
			onClick={() => {
				if(!isExpanded){
					onExpandChange?.()
				}
				onAddChild(path)
			}}
			key="add-child"
		/>)
	}

	const canEdit = !!(isTreeBranch(row) ? canEditBranchLabel : canEditLeafLabel)
	if(canEdit){
		buttons.push(<Button
			variant="plain-icon"
			icon={Icon.pencil}
			onClick={() => setInlineEditPath(path)}
			key="edit"
		/>)
	}

	const canDelete = !!(isTreeBranch(row) ? canDeleteBranch : canDeleteLeaf)
	if(canDelete){
		buttons.push(<Button
			variant="plain-icon"
			icon={Icon.close}
			onClick={() => onNodeDelete(path, row)}
			holdTimeUntilAction={500}
			key="delete"
		/>)
	}

	const buttonsEl = buttons.length === 0 ? null : <div className={css.rowButtons}>{buttons}</div>

	const className = cn(css.treeRow, {
		[css.isExpanded!]: isExpanded,
		[css.isSelected!]: isSelected
	})

	if(isTreeBranch(row)){
		const onRowClick = (e: React.MouseEvent) => {
			if(shouldHandleRowClick(e)){
				onBranchClick?.(row.value, path)
				onExpandChange?.()
			}
		}

		const onRowDblClick = (e: React.MouseEvent) => {
			if(shouldHandleRowClick(e)){
				onBranchDoubleclick?.(row.value, path)
			}
		}

		return (
			<div
				className={className}
				onClick={onRowClick}
				onDoubleClick={onRowDblClick}
				data-path={JSON.stringify(path)}>
				<TreeRowSquares squares={squares ?? []} endsWith="expander"/>
				{labelOrEditor}
				{buttonsEl}
			</div>
		)
	} else {
		const onRowDblClick = (e: React.MouseEvent) => {
			if(shouldHandleRowClick(e)){
				onLeafDoubleclick?.(row.value, path)
			}
		}

		const onRowClick = (e: React.MouseEvent) => {
			if(shouldHandleRowClick(e)){
				onLeafClick?.(row.value, path)
			}
		}

		return (
			<div
				className={className}
				onClick={onRowClick}
				onDoubleClick={onRowDblClick}
				data-path={JSON.stringify(path)}>
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

const TreeRowSquares = ({squares, endsWith}: {squares: SquareName[], endsWith?: "expander" | "horisontal"}) => {
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

export const TreeBranchChildren = <T, B>({
	tree, squares, path, ...props
}: TreeBranchChildrenProps<T, B>) => {
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
					if(!getBranchKey){
						throw new Error("Cannot get branch key: no function provided")
					}
					return (
						<TreeBranch
							branch={tree}
							key={getBranchKey(tree.value, path, tree)}
							squares={squares}
							path={newPath}
							{...props}
						/>
					)
				} else {
					return (
						<TreeRow
							row={tree}
							key={getLeafKey(tree.value, path, tree)}
							squares={squares}
							path={newPath}
							{...props}
						/>
					)
				}
			})}
		</>
	)
}
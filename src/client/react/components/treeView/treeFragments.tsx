import {Tree, TreeBranch, isTreeBranch} from "common/tree"

import * as css from "./treeView.module.scss"
import {useState} from "react"
import {cn} from "client/react/uiUtils/classname"
import {Icon} from "generated/icons"

type BaseProps<L, B> = {
	// eslint-disable-next-line react/no-unused-prop-types
	readonly getBranchKey: (branch: B) => string
	// eslint-disable-next-line react/no-unused-prop-types
	readonly getLeafKey: (leaf: L) => string
	readonly getBranchLabel: (branch: B) => React.ReactNode
	readonly getLeafLabel: (leaf: L) => React.ReactNode
	readonly onLeafDoubleclick?: (leaf: L) => void
	readonly squares?: SquareName[]
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

const TreeRow = <T, B>({row, squares, isExpanded, getBranchLabel, getLeafLabel, onExpandChange, onLeafDoubleclick}: RowProps<T, B>) => {
	if(isTreeBranch(row)){
		return (
			<div className={cn(css.treeRow, {[css.isExpanded!]: isExpanded})} onClick={onExpandChange}>
				<TreeRowSquares squares={squares ?? []} endsWith="expander"/>
				{getBranchLabel(row.value)}
			</div>
		)
	} else {
		return (
			<div className={css.treeRow} onDoubleClick={() => onLeafDoubleclick?.(row.value)}>
				{!squares
					? <TreeRowSquares squares={["empty"]}/>
					: <TreeRowSquares squares={squares} endsWith="horisontal"/>}
				{getLeafLabel(row.value)}
			</div>
		)
	}
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

export const TreeBranchChildren = <T, B>({tree, squares, ...props}: TreeBranchChildrenProps<T, B>) => {
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
				if(isTreeBranch(tree)){
					return (
						<TreeBranch
							branch={tree}
							key={getBranchKey(tree.value)}
							squares={squares}
							{...props}/>
					)
				} else {
					return (
						<TreeRow
							row={tree}
							key={getLeafKey(tree.value)}
							squares={squares}
							{...props}/>
					)
				}
			})}
		</>
	)
}
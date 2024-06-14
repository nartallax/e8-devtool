import {Tree, TreeBranch, TreePath, isTreeBranch} from "common/tree"
import * as css from "./treeView.module.scss"
import {TreeBranchChildren, TreeBranchChildrenProps} from "client/react/components/treeView/treeFragments"
import {MutableRefObject, useCallback, useMemo, useRef, useState} from "react"
import {SetState} from "client/react/uiUtils/setState"
import {TreeDragContextProvider} from "client/react/components/treeView/treeDragContext"

export type TreeViewProps<L, B> = Omit<TreeBranchChildrenProps<L, B>, "squares" | "path" | "inlineEditPath" | "onLabelEditComplete" | "canEditBranchLabel" | "canEditLeafLabel" | "setInlineEditPath" | "onNodeDelete" | "canDeleteBranch" | "canDeleteLeaf"> & {
	readonly controlRef?: MutableRefObject<TreeControls | null>
	readonly onBranchLabelEdit?: (path: TreePath, newLabel: string) => void
	readonly onBranchLabelEditCancel?: (path: TreePath) => void
	readonly onLeafLabelEdit?: (path: TreePath, newLabel: string) => void
	readonly onLeafLabelEditCancel?: (path: TreePath) => void
	readonly onBranchDelete?: (path: TreePath) => void
	readonly onLeafDelete?: (path: TreePath) => void
	readonly onDrag?: (from: TreePath, to: TreePath) => void
	/** Allows to control if @param child can be dragged to be child of @param parent. Defaults to () => true.  */
	readonly canBeChildOf?: (child: Tree<L, B>, parent: TreeBranch<L, B> | null) => boolean
}

/** This object provides some external controls for tree view
Usually it's done by hoisting state out of control,
but I don't want to do that in this case because it's a lot of state
that really should stay within this control */
export type TreeControls = {
	setInlineEditPath: SetState<TreePath | null>
}

// TODO: search?
export const TreeView = <L, B>({
	onBranchLabelEdit, onLeafLabelEdit, onBranchDelete, onLeafDelete, onDrag, canBeChildOf, onBranchLabelEditCancel, onLeafLabelEditCancel,
	controlRef, tree, ...props
}: TreeViewProps<L, B>) => {
	const rootRef = useRef<HTMLDivElement | null>(null)

	const [inlineEditPath, setInlineEditPath] = useState<TreePath | null>(null)
	const controls = useMemo(() => ({
		setInlineEditPath
	}), [])

	const onLabelEditComplete = useCallback((path: TreePath, tree: Tree<L, B>, newLabel: string | null) => {
		setInlineEditPath(null)
		if(newLabel?.trim()){
			if(isTreeBranch(tree)){
				onBranchLabelEdit?.(path, newLabel)
			} else {
				onLeafLabelEdit?.(path, newLabel)
			}
		} else if(isTreeBranch(tree)){
			onBranchLabelEditCancel?.(path)
		} else {
			onLeafLabelEditCancel?.(path)
		}
	}, [onBranchLabelEdit, onLeafLabelEdit, onBranchLabelEditCancel, onLeafLabelEditCancel])

	const onNodeDelete = useCallback((path: TreePath, tree: Tree<L, B>) => {
		setInlineEditPath(null) // just to avoid weird state
		if(isTreeBranch(tree)){
			onBranchDelete?.(path)
		} else {
			onLeafDelete?.(path)
		}
	}, [onBranchDelete, onLeafDelete])

	if(controlRef){
		controlRef.current = controls
	}

	return (
		<TreeDragContextProvider
			canBeChildOf={canBeChildOf}
			tree={tree}
			onDrag={onDrag}
			rootRef={rootRef}
			canDrag={!!onDrag}>
			<div className={css.treeView} ref={rootRef}>
				<TreeBranchChildren
					{...props}
					path={[]}
					inlineEditPath={inlineEditPath}
					onLabelEditComplete={onLabelEditComplete}
					canEditBranchLabel={!!onBranchLabelEdit}
					canEditLeafLabel={!!onLeafLabelEdit}
					setInlineEditPath={setInlineEditPath}
					onNodeDelete={onNodeDelete}
					canDeleteBranch={!!onBranchDelete}
					canDeleteLeaf={!!onLeafDelete}
					tree={tree}
				/>
			</div>
		</TreeDragContextProvider>
	)
}

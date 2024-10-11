import * as css from "./tree_view.module.scss"
import {TreeBranchChildren, TreeBranchChildrenProps} from "client/components/tree_view/tree_fragments"
import {MutableRefObject, useCallback, useMemo, useRef, useState} from "react"
import {SetState} from "client/ui_utils/react_types"
import {useTreeViewDragProps} from "client/components/tree_view/tree_drag"
import {ForestPath, Tree, TreeBranch} from "@nartallax/forest"

export type TreeViewProps<L, B> = Omit<TreeBranchChildrenProps<L, B>, "squares" | "path" | "inlineEditPath" | "onLabelEditComplete" | "canEditBranchLabel" | "canEditLeafLabel" | "setInlineEditPath" | "onNodeDelete" | "canDeleteBranch" | "canDeleteLeaf" | "tree"> & {
	controlRef?: MutableRefObject<TreeControls | null>
	onLabelEdit?: (path: ForestPath, newLabel: string, node: Tree<L, B>) => void
	onLabelEditCancel?: (path: ForestPath, node: Tree<L, B>) => void
	onDelete?: (path: ForestPath, node: Tree<L, B>) => void
	onDrag?: (from: ForestPath, to: ForestPath) => void
	/** Allows to control if @param child can be dragged to be child of @param parent. Defaults to () => true. */
	canBeChildOf?: (child: Tree<L, B>, parent: TreeBranch<L, B> | null) => boolean
}

/** This object provides some external controls for tree view
Usually it's done by hoisting state out of control,
but I don't want to do that in this case because it's a lot of state
that really should stay within this control */
export type TreeControls = {
	setInlineEditPath: SetState<ForestPath | null>
}

export const TreeView = <L, B>({
	onLabelEdit, onDelete, onDrag, canBeChildOf, onLabelEditCancel,
	controlRef, forest, ...props
}: TreeViewProps<L, B>) => {
	const rootRef = useRef<HTMLDivElement | null>(null)

	const [inlineEditPath, setInlineEditPath] = useState<ForestPath | null>(null)
	const controls = useMemo(() => ({
		setInlineEditPath
	}), [])

	const onLabelEditComplete = useCallback((path: ForestPath, tree: Tree<L, B>, newLabel: string | null) => {
		setInlineEditPath(null)
		if(newLabel?.trim()){
			onLabelEdit?.(path, newLabel, tree)
		} else {
			onLabelEditCancel?.(path, tree)
		}
	}, [onLabelEdit, onLabelEditCancel])

	const onNodeDelete = useCallback((path: ForestPath, tree: Tree<L, B>) => {
		setInlineEditPath(null) // just to avoid weird state
		onDelete?.(path, tree)
	}, [onDelete])

	if(controlRef){
		controlRef.current = controls
	}

	const dragProps = useTreeViewDragProps({
		canBeChildOf, trees: forest, onDrag, rootRef
	})


	return (
		<div className={css.treeView} ref={rootRef} {...onDrag ? dragProps : {}}>
			<TreeBranchChildren
				{...props}
				path={[]}
				inlineEditPath={inlineEditPath}
				onLabelEditComplete={onLabelEditComplete}
				canEditBranchLabel={!!onLabelEdit}
				canEditLeafLabel={!!onLabelEdit}
				setInlineEditPath={setInlineEditPath}
				onNodeDelete={onNodeDelete}
				canDeleteBranch={!!onDelete}
				canDeleteLeaf={!!onDelete}
				tree={forest}
				forest={forest}
			/>
		</div>
	)
}

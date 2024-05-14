import {Tree, TreePath, isTreeBranch} from "common/tree"
import * as css from "./treeView.module.scss"
import {TreeBranchChildren, TreeBranchChildrenProps} from "client/react/components/treeView/treeFragments"
import {MutableRefObject, useCallback, useMemo, useState} from "react"
import {SetState} from "client/react/uiUtils/setState"

type Props<L, B> = Omit<TreeBranchChildrenProps<L, B>, "squares" | "path" | "inlineEditPath" | "onLabelEditComplete" | "canEditBranchLabel" | "canEditLeafLabel" | "setInlineEditPath" | "onNodeDelete" | "canDeleteBranch" | "canDeleteLeaf"> & {
	readonly controlRef?: MutableRefObject<TreeControls | null>
	readonly onBranchLabelEdit?: (path: TreePath, newLabel: string) => void
	readonly onLeafLabelEdit?: (path: TreePath, newLabel: string) => void
	readonly onBranchDelete?: (path: TreePath) => void
	readonly onLeafDelete?: (path: TreePath) => void
}

/** This object provides some external controls for tree view
Usually it's done by hoisting state out of control,
but I don't want to do that in this case because it's a lot of state
that really should stay within this control */
export type TreeControls = {
	setInlineEditPath: SetState<TreePath | null>
}

export const TreeView = <L, B>({controlRef, onBranchLabelEdit, onLeafLabelEdit, onBranchDelete, onLeafDelete, ...props}: Props<L, B>) => {
	const [inlineEditPath, setInlineEditPath] = useState<TreePath | null>(null)
	const controls = useMemo(() => ({
		setInlineEditPath
	}), [])

	const onLabelEditComplete = useCallback((path: TreePath, tree: Tree<L, B>, newLabel: string | null) => {
		setInlineEditPath(null)
		if(!newLabel?.trim()){
			return
		}

		if(isTreeBranch(tree)){
			onBranchLabelEdit?.(path, newLabel)
		} else {
			onLeafLabelEdit?.(path, newLabel)
		}
	}, [onBranchLabelEdit, onLeafLabelEdit])

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
		<div className={css.treeView}>
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
				canDeleteLeaf={!!onLeafDelete}/>
		</div>
	)
}

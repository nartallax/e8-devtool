import * as css from "./treeView.module.scss"
import {TreeBranchChildren, TreeBranchChildrenProps} from "client/react/components/treeView/treeFragments"

type Props<L, B> = Omit<TreeBranchChildrenProps<L, B>, "squares">

export const TreeView = <T, B>(props: Props<T, B>) => {
	return (
		<div className={css.treeView}>
			<TreeBranchChildren {...props}/>
		</div>
	)
}

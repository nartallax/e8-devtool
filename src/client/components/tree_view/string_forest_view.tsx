import {MappedForestView} from "client/components/tree_view/mapped_forest_view"
import {Tree, TreePath} from "common/tree"
import {getForestPaths} from "data/project_utils"
import {useMemo} from "react"

type Props = {
	forest: Tree<string, string>[]
	canSelectBranches?: boolean
	getObjectKey: (parts: string[], isPrefix: boolean) => string
	selectedItem?: string | null
	onItemClick?: (item: string, path: TreePath) => void
	onItemDoubleclick?: (item: string, path: TreePath) => void
}

/** Readonly treeview of string tree */
export const StringForestView = ({
	forest, canSelectBranches, onItemClick, onItemDoubleclick, ...props
}: Props) => {
	// it's easier to create map to reuse <MappedForestView> than to create new component just for this
	const map = useMemo(() => {
		const map: Record<string, string> = {}
		for(const [path] of getForestPaths(forest, canSelectBranches)){
			map[path] = path
		}
		return map
	}, [forest, canSelectBranches])

	return (
		<MappedForestView
			forest={forest}
			mapObject={map}
			onItemClick={onItemClick}
			onItemDoubleclick={onItemDoubleclick}
			onBranchClick={!canSelectBranches || !onItemClick ? undefined : (item, path) => item && onItemClick(item, path)}
			onBranchDoubleClick={!canSelectBranches || !onItemDoubleclick ? undefined : (item, path) => item && onItemDoubleclick(item, path)}
			{...props}
		/>
	)
}
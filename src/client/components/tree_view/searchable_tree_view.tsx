import {SearchInput} from "client/components/text_input/search_input"
import {TreeView, TreeViewProps} from "client/components/tree_view/tree_view"
import {filterForestLeaves, getFirstTreeLeaf, getFirstTreeLeafPath} from "common/tree"
import {useMemo, useState} from "react"

export type SearchableTreeViewProps<L, B> = TreeViewProps<L, B> & {
	getSearchText?: (leaf: L) => string
}

export const SearchableTreeView = <L, B>({
	getSearchText, isEverythingExpanded, onLeafDoubleclick, tree, ...props
}: SearchableTreeViewProps<L, B>) => {

	const [searchText, setSearchText] = useState("")
	const [filteredTree, isForceExpanded] = useMemo(() => {
		if(!searchText || !getSearchText){
			return [tree, false]
		}
		const text = searchText.toLowerCase()

		let leafCount = 0
		const resultTree = filterForestLeaves(tree, leaf => {
			if(getSearchText(leaf).toLowerCase().indexOf(text) >= 0){
				leafCount++
				return true
			}
			return false
		})

		// if we have found more than 50 leaves - expanding will be chaos, so let's not
		// no strong theory behind this value, just something that feels right
		return [resultTree, leafCount < 50]
	}, [searchText, getSearchText, tree])

	const onSearchAccept = () => {
		const firstLeaf = getFirstTreeLeaf(filteredTree)
		const firstLeafPath = getFirstTreeLeafPath(filteredTree)
		if(!firstLeafPath || !firstLeaf){
			return
		}
		if(onLeafDoubleclick){
			onLeafDoubleclick(firstLeaf, firstLeafPath)
		}
	}

	return (
		<>
			{!!getSearchText && <SearchInput
				onChange={setSearchText}
				inputWaitTime={250}
				isAutofocused
				onAccept={onSearchAccept}
			/>}
			<TreeView
				{...props}
				onLeafDoubleclick={onLeafDoubleclick}
				isEverythingExpanded={isForceExpanded || isEverythingExpanded}
				tree={filteredTree}
			/>
		</>
	)
}
import {Forest} from "@nartallax/forest"
import {SearchInput} from "client/components/text_input/search_input"
import {TreeView, TreeViewProps} from "client/components/tree_view/tree_view"
import {useMemo, useState} from "react"

export type SearchableTreeViewProps<L, B> = TreeViewProps<L, B> & {
	getSearchText?: (leaf: L) => string
}

export const SearchableTreeView = <L, B>({
	getSearchText, isEverythingExpanded, onLeafDoubleclick, forest, ...props
}: SearchableTreeViewProps<L, B>) => {

	const [searchText, setSearchText] = useState("")
	const [filteredForest, isForceExpanded] = useMemo(() => {
		if(!searchText || !getSearchText){
			return [forest, false]
		}
		const text = searchText.toLowerCase()

		let leafCount = 0
		const resultTree = new Forest(forest).filterLeaves(leaf => {
			if(getSearchText(leaf).toLowerCase().includes(text)){
				leafCount++
				return true
			}
			return false
		}).trees

		// if we have found more than 50 leaves - expanding will be chaos, so let's not
		// no strong theory behind this value, just something that feels right
		return [resultTree, leafCount < 50]
	}, [searchText, getSearchText, forest])

	const onSearchAccept = () => {
		const forest = new Forest(filteredForest)
		const firstLeaf = forest.getFirstLeaf()
		const firstLeafPath = forest.getFirstLeafPath()
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
				forest={filteredForest}
			/>
		</>
	)
}
import {defineNestedTreeContext} from "client/ui_utils/define_nested_tree_context"
import {useEffect} from "react"

type TitlePart = {
	part: string
}

type Props = {
	defaultTitle?: string
}

export const {RootProvider: TitleProvider, NestedProvider: TitlePart} = defineNestedTreeContext({
	name: "TitleContext",
	useNestedValue: ({part}: TitlePart) => part,
	useRootValue: ({defaultTitle}: Props, treeServices) => {
		useEffect(() => {
			let title: string
			if(treeServices.forest.length === 0){
				title = defaultTitle ?? ""
			} else {
				title = treeServices.getSortedByDepth().join("")
			}
			document.title = title
		}, [defaultTitle, treeServices])
	}
})

import {Tree, TreePath} from "common/tree"
import {PropsWithChildren, RefObject, createContext, useContext} from "react"

type TreeDragContextValue<T, B> = {
	onDrag?: (from: TreePath, to: TreePath) => void
	rootRef?: RefObject<HTMLElement | null>
	tree: readonly Tree<T, B>[]
	canBeChildOf?: (child: Tree<T, B>, parent: Tree<T, B> | null) => boolean
}

const treeDragContextDefault: TreeDragContextValue<unknown, unknown> = {
	tree: []
}

const TreeDragContext = createContext(treeDragContextDefault)

export const TreeDragContextProvider = <T, B>({value, children}: PropsWithChildren<{readonly value: TreeDragContextValue<T, B>}>) => {
	return (
		<TreeDragContext.Provider value={value as TreeDragContextValue<unknown, unknown>}>
			{children}
		</TreeDragContext.Provider>
	)
}

export const useTreeDragContext = <T, B>(): TreeDragContextValue<T, B> => {
	return useContext(TreeDragContext) as TreeDragContextValue<T, B>
}
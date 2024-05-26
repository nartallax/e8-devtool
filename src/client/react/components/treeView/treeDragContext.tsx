import {Tree, TreeBranch, TreePath} from "common/tree"
import {PropsWithChildren, RefObject, createContext, useCallback, useContext, useRef} from "react"

type TreeDragContextValue<T, B> = {
	readonly onDrag?: (from: TreePath, to: TreePath) => void
	readonly rootRef?: RefObject<HTMLElement | null>
	readonly tree: readonly Tree<T, B>[]
	readonly canBeChildOf?: (child: Tree<T, B>, parent: TreeBranch<T, B> | null) => boolean
	readonly canDrag?: boolean
}

const treeDragContextDefault: TreeDragContextValue<unknown, unknown> = {
	tree: []
}

const TreeDragContext = createContext(treeDragContextDefault)

export const TreeDragContextProvider = <T, B>({children, ...value}: PropsWithChildren<TreeDragContextValue<T, B>>) => {

	// this is a hack
	// treeDrag is implemented as one big useEffect
	// which means once drag is started - old value of callback is stored
	// but it could be updated; so this indirect call is required
	const onDragRef = useRef<TreeDragContextValue<T, B>["onDrag"]>(value.onDrag)
	onDragRef.current = value.onDrag
	const onDrag = useCallback((from: TreePath, to: TreePath) => onDragRef.current?.(from, to), [])
	const fixedValue = {...value, onDrag} as TreeDragContextValue<unknown, unknown>

	return (
		<TreeDragContext.Provider value={fixedValue}>
			{children}
		</TreeDragContext.Provider>
	)
}

export const useTreeDragContext = <T, B>(): TreeDragContextValue<T, B> => {
	return useContext(TreeDragContext) as TreeDragContextValue<T, B>
}
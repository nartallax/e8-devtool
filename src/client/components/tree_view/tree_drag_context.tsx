import {defineContext} from "client/ui_utils/define_context"
import {Tree, TreeBranch, TreePath} from "common/tree"
import {RefObject, useCallback, useRef} from "react"

type TreeDragContextValue<T, B> = {
	readonly onDrag?: (from: TreePath, to: TreePath) => void
	readonly rootRef?: RefObject<HTMLElement | null>
	readonly tree: readonly Tree<T, B>[]
	readonly canBeChildOf?: (child: Tree<T, B>, parent: TreeBranch<T, B> | null) => boolean
	readonly canDrag?: boolean
}

const [_TreeDragContextProvider, _useTreeDragContext] = defineContext({
	name: "TreeDragContext",
	useValue: (value: TreeDragContextValue<unknown, unknown>) => {
		// this is a hack
		// treeDrag is implemented as one big useEffect
		// which means once drag is started - old value of callback is stored
		// but it could be updated; so this indirect call is required
		const onDragRef = useRef<TreeDragContextValue<unknown, unknown>["onDrag"]>(value.onDrag)
		onDragRef.current = value.onDrag
		const onDrag = useCallback((from: TreePath, to: TreePath) => onDragRef.current?.(from, to), [])
		const fixedValue = {...value, onDrag} as TreeDragContextValue<unknown, unknown>
		return fixedValue
	}
})

export const TreeDragContextProvider = _TreeDragContextProvider
export const useTreeDragContext = _useTreeDragContext as <T, B>() => TreeDragContextValue<T, B>
import {RefObject, useRef} from "react"
import * as css from "./tree_view.module.scss"
import {Tree, TreeBranch, TreePath, getBranchByPath, getTreeByPath, isTreeBranch} from "common/tree"
import {nodeOrParentThatMatches} from "client/ui_utils/dom_queries"
import {lockUserSelect, unlockUserSelect} from "client/ui_utils/user_select_lock"
import {AnyPointerEvent, pointerEventsToClientCoords, pointerEventsToOffsetCoords, useMouseDragProps} from "client/ui_utils/use_mouse_drag"



type DragDestinationDisposition = "above" | "below" | "inside"
type DragDestination<T, B> = {
	path: TreePath
	tree: Tree<T, B>
	disposition: DragDestinationDisposition
	rect: DOMRect
}

type RowElPath = {
	el: HTMLElement
	path: TreePath
}

type TreeDragParams<T, B> = {
	onDrag?: (from: TreePath, to: TreePath) => void
	rootRef: RefObject<HTMLElement | null>
	forest: Tree<T, B>[]
	canBeChildOf?: (child: Tree<T, B>, parent: TreeBranch<T, B> | null) => boolean
}

export const useTreeViewDragProps = <T, B>({
	onDrag: _onDrag, rootRef, canBeChildOf, forest
}: TreeDragParams<T, B>) => {
	const offset = useRef({x: 0, y: 0})
	const destination = useRef<DragDestination<T, B> | null>(null)
	const draggedRow = useRef<RowElPath | null>(null)

	const onDragRef = useRef(_onDrag)
	onDragRef.current = _onDrag

	const updateDest = (e: AnyPointerEvent) => {
		const newDest = getDragDestination(forest, e)
		const root = rootRef.current
		if(!newDest || !draggedRow.current || !root){
			return
		}

		if(isPathInsidePath(draggedRow.current.path, newDest.path)){
			return
		}

		if(canBeChildOf){
			let parent: TreeBranch<T, B> | null = null
			if(newDest.disposition === "inside"){
				parent = newDest.tree as TreeBranch<T, B>
			} else {
				const parentPath = newDest.path.slice(0, newDest.path.length - 1)
				if(parentPath.length > 0){
					parent = getBranchByPath(forest, parentPath)
				}
			}

			if(!canBeChildOf(getTreeByPath(forest, draggedRow.current.path), parent)){
				return
			}
		}

		const dest = destination.current = newDest
		const rootRect = root.getBoundingClientRect()
		const markerY = dest.rect.top - rootRect.top + (
			dest.disposition === "above" ? 0
				: dest.disposition === "below" ? dest.rect.height
					: dest.rect.height / 2)
		root.style.setProperty("--drag-dest-y", markerY + "px")
	}

	return useMouseDragProps({
		distanceBeforeMove: 3,
		start: e => {
			const target = getRowPath(e)
			const root = rootRef.current
			if(!target || !root){
				return false
			}
			draggedRow.current = target

			const rowRect = target.el.getBoundingClientRect()
			const rootRect = root.getBoundingClientRect()
			offset.current = {
				x: rowRect.left - rootRect.left,
				y: rowRect.top - rootRect.top
			}

			lockUserSelect()
			root.classList.add(css.dragContainer!)
			target.el.classList.add(css.draggedRow!)
			return true
		},
		stop: () => {
			const target = draggedRow.current
			const root = rootRef.current
			if(!target || !root){
				return
			}
			unlockUserSelect()

			root.classList.remove(css.dragContainer!)
			root.style.removeProperty("--drag-offset-x")
			root.style.removeProperty("--drag-offset-y")
			root.style.removeProperty("--drag-dest-y")
			target.el.classList.remove(css.draggedRow!)
			let dest = destination.current
			if(dest){
				const destPath = [...dest.path]
				if(dest.disposition === "below"){
					destPath[destPath.length - 1]!++
				} else if(dest.disposition === "inside"){
					destPath.push(0)
				}
				onDragRef.current?.(target.path, destPath)
			}
			dest = null
		},
		onMove: e => {
			const root = rootRef.current
			if(!root){
				return
			}

			const {x, y} = pointerEventsToOffsetCoords(e, root)!
			root.style.setProperty("--drag-offset-x", (x - offset.current.x) + "px")
			root.style.setProperty("--drag-offset-y", (y - offset.current.y) + "px")
			updateDest(e)
		}
	})
}


const getDragDestination = <T, B>(tree: Tree<T, B>[], event: AnyPointerEvent): DragDestination<T, B> | null => {
	const searchResult = getRowPath(event)
	if(!searchResult){
		return null
	}
	const {path, el: targetRow} = searchResult

	const targetRect = targetRow.getBoundingClientRect()
	const {y} = pointerEventsToClientCoords(event)
	const dispositionYPercent = (y - targetRect.top) / targetRect.height

	const targetTree = getTreeByPath(tree, path)
	let disp: DragDestinationDisposition = isTreeBranch(targetTree)
		? dispositionYPercent < 0.25 ? "above" : dispositionYPercent > 0.75 ? "below" : "inside"
		: dispositionYPercent < 0.5 ? "above" : "below"

	if(targetRow.classList.contains(css.isExpanded!) && disp === "below"){
		// if we don't make this alteration - result will point outside of the branch, which feels weird
		disp = "inside"
	}
	return {
		path, tree: targetTree, disposition: disp, rect: targetRect
	}
}

const getRowPath = (event: AnyPointerEvent): RowElPath | null => {
	if(!(event.target instanceof Node)){
		return null // should never happen
	}
	const el = nodeOrParentThatMatches(event.target, (node): node is HTMLElement => {
		if(!(node instanceof HTMLElement)){
			return false
		}

		const pathStr = node.getAttribute("data-path")
		if(pathStr !== null){
			return true
		}

		return node.classList.contains(css.treeView!)
	})

	if(!el || el.classList.contains(css.treeView!)){
		return null
	}

	const path: TreePath = JSON.parse(el.getAttribute("data-path")!)
	return {path, el}
}

const isPathInsidePath = (maybeParent: TreePath, maybeChild: TreePath): boolean => {
	if(maybeChild.length < maybeParent.length){
		return false
	}
	for(let i = 0; i < maybeParent.length; i++){
		if(maybeChild[i] !== maybeParent[i]){
			return false
		}
	}
	return true
}
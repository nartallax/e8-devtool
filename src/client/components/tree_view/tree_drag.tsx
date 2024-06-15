import {addMouseDragHandler, pointerEventsToClientCoords, pointerEventsToOffsetCoords} from "common/mouse_drag"
import {RefObject, useEffect} from "react"
import * as css from "./tree_view.module.scss"
import {Tree, TreeBranch, TreePath, getBranchByPath, getTreeByPath, isTreeBranch} from "common/tree"
import {nodeOrParentThatMatches} from "client/ui_utils/dom_queries"
import {useTreeDragContext} from "client/components/tree_view/tree_drag_context"
import {lockUserSelect, unlockUserSelect} from "client/ui_utils/user_select_lock"



type DragDestinationDisposition = "above" | "below" | "inside"
type DragDestination<T, B> = {
	path: TreePath
	tree: Tree<T, B>
	disposition: DragDestinationDisposition
	rect: DOMRect
}

export const useTreeViewDrag = <T, B>(rowRef: RefObject<HTMLElement | null>, rowPath: TreePath) => {
	const {onDrag, canDrag, rootRef, canBeChildOf, tree} = useTreeDragContext<T, B>()

	useEffect(() => {
		if(!onDrag || !rootRef || !canDrag){
			return
		}

		const el = rowRef.current
		const root = rootRef.current
		if(!el || !root){
			throw new Error("No required elements!")
		}

		let draggedRowOffsetX = 0
		let draggedRowOffsetY = 0
		let dest: DragDestination<T, B> | null = null

		const updateDest = (e: MouseEvent | TouchEvent) => {
			const newDest = getDragDestination(tree, e)
			if(!newDest){
				return
			}

			if(isPathInsidePath(rowPath, newDest.path)){
				return
			}

			if(canBeChildOf){
				let parent: TreeBranch<T, B> | null = null
				if(newDest.disposition === "inside"){
					parent = newDest.tree as TreeBranch<T, B>
				} else {
					const parentPath = newDest.path.slice(0, newDest.path.length - 1)
					if(parentPath.length > 0){
						parent = getBranchByPath(tree, parentPath)
					}
				}

				if(!canBeChildOf(getTreeByPath(tree, rowPath), parent)){
					return
				}
			}

			dest = newDest
			const rootRect = root.getBoundingClientRect()
			const markerY = dest.rect.top - rootRect.top + (
				dest.disposition === "above" ? 0
					: dest.disposition === "below" ? dest.rect.height
						: dest.rect.height / 2)
			root.style.setProperty("--drag-dest-y", markerY + "px")
		}

		const handlers = addMouseDragHandler({
			element: el,
			distanceBeforeMove: 3,
			start: () => {
				const rowRect = el.getBoundingClientRect()
				const rootRect = root.getBoundingClientRect()
				draggedRowOffsetX = rowRect.left - rootRect.left
				draggedRowOffsetY = rowRect.top - rootRect.top

				lockUserSelect()
				root.classList.add(css.dragContainer!)
				el.classList.add(css.draggedRow!)
			},
			stop: () => {
				unlockUserSelect()
				root.classList.remove(css.dragContainer!)
				root.style.removeProperty("--drag-offset-x")
				root.style.removeProperty("--drag-offset-y")
				root.style.removeProperty("--drag-dest-y")
				el.classList.remove(css.draggedRow!)
				if(dest){
					const destPath = [...dest.path]
					if(dest.disposition === "below"){
						destPath[destPath.length - 1]!++
					} else if(dest.disposition === "inside"){
						destPath.push(0)
					}
					onDrag(rowPath, destPath)
				}
				dest = null
			},
			onMove: e => {
				const {x, y} = pointerEventsToOffsetCoords(e, root)!
				root.style.setProperty("--drag-offset-x", (x - draggedRowOffsetX) + "px")
				root.style.setProperty("--drag-offset-y", (y - draggedRowOffsetY) + "px")
				updateDest(e)
			}
		})

		return () => handlers.detach()
	}, [rowRef, onDrag, rootRef, canBeChildOf, tree, rowPath, canDrag])
}


const getDragDestination = <T, B>(tree: Tree<T, B>[], event: MouseEvent | TouchEvent): DragDestination<T, B> | null => {
	const searchResult = getRowPath(event)
	if(!searchResult){
		return null
	}
	const [path, targetRow] = searchResult

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
	return {path, tree: targetTree, disposition: disp, rect: targetRect}
}

const getRowPath = (event: MouseEvent | TouchEvent): [TreePath, HTMLElement] | null => {
	if(!(event.target instanceof Node)){
		return null // should never happen
	}
	const parent = nodeOrParentThatMatches(event.target, (node): node is HTMLElement => {
		if(!(node instanceof HTMLElement)){
			return false
		}

		const pathStr = node.getAttribute("data-path")
		if(pathStr !== null){
			return true
		}

		return node.classList.contains(css.treeView!)
	})

	if(!parent || parent.classList.contains(css.treeView!)){
		return null
	}

	const path: TreePath = JSON.parse(parent.getAttribute("data-path")!)
	return [path, parent]
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
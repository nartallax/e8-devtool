import {MRBox, RBox, WBox, box, constBox, isWBox} from "@nartallax/cardboard"
import {tag} from "@nartallax/cardboard-dom"
import {Tree, TreeBranch, isTreeBranch} from "common/tree"
import * as css from "./tree_view.module.scss"
import {Icon} from "generated/icons"
import {TreeViewDragHandlers, makeTreeViewDragAttacher} from "client/component/tree_view/tree_view_drag"
import {attachDeletionTimerToButton} from "common/deletion_timer"

interface Props<T, B> {
	readonly data: RBox<readonly Tree<T, B>[]>
	// assumed unique and unchangeable for all the data
	readonly getId: (value: Tree<T, B>) => number | string | boolean | null
	readonly allowReorder?: "within-parent" | boolean
	readonly getRowLabel: (value: RBox<Tree<T, B>>) => MRBox<string>
	readonly isFlat?: boolean
	readonly selectedLeaf?: WBox<number | string | null>
	readonly canEdit?: (tree: Tree<T, B>) => boolean
	readonly onEdit?: (row: WBox<Tree<T, B>>) => void
	readonly onDblclick?: (row: WBox<Tree<T, B>>) => void
	readonly onDelete?: (row: RBox<Tree<T, B>>) => void
	readonly onAddToBranch?: (row: WBox<TreeBranch<T, B>>) => void
}

export interface TreeViewRowData<T, B> {
	box: RBox<Tree<T, B>>
	id: string
	el: HTMLElement
	rowEl: HTMLElement
	isBranch: boolean
	isExpanded: RBox<boolean>
	childBox: RBox<readonly Tree<T, B>[]> | null
}

export const TreeView = <T, B>(props: Props<T, B>) => {
	const getId = (x: Tree<T, B>) => JSON.stringify(props.getId(x))
	const allRowsById = new Map<string, TreeViewRowData<T, B>>()
	const root = tag({class: [css.treeView, {
		[css.flat!]: props.isFlat
	}]})
	const selectedLeaf = !props.selectedLeaf
		? null
		: props.selectedLeaf.map(id => id === null ? null : JSON.stringify(id), strId => strId === null ? null : JSON.parse(strId))
	const canEdit = props.canEdit
	const onEdit = props.onEdit
	const onDelete = props.onDelete
	const onAddToBranch = props.onAddToBranch
	const onDblclick = props.onDblclick ?? onEdit

	let dragHandlers: TreeViewDragHandlers<T, B> | null = null
	if(props.allowReorder){
		if(!isWBox(props.data)){
			throw new Error("Cannot enable dragndrop, data is not mutable")
		} else {
			dragHandlers = makeTreeViewDragAttacher(root, allRowsById, props.data, {
				restrictToParent: props.allowReorder === "within-parent"
			})
		}
	}

	if(onEdit && !isWBox(props.data)){
		throw new Error("Cannot enable renaming, data is not mutable")
	}

	root.appendChild(renderList(props.data, 0))

	function renderList(list: RBox<readonly Tree<T, B>[]>, depth: number): HTMLElement {

		return tag([list.mapArray(getId, row => {
			const isBranch = isTreeBranch(row.get())
			const isExpanded = isBranch ? box(false) : constBox(false)
			const id = getId(row.get())

			const rowEl = tag({
				class: [css.row, {
					[css.branchRow!]: isBranch,
					[css.selectedLeaf!]: !selectedLeaf ? false : selectedLeaf.map(selectedId => selectedId === id),
					[css.selectableLeaf!]: !!selectedLeaf
				}],
				attrs: {"data-row-id": id}
			}, [
				Expander(isExpanded, depth),
				tag({class: css.rowLabel}, [props.getRowLabel(row)])
			])

			if(onDblclick){
				rowEl.addEventListener("dblclick", () => {
					onDblclick(row as WBox<Tree<T, B>>)
				}, {passive: true})
			}

			if(onEdit){
				const renameButton = tag({
					tag: "button",
					class: [css.rowButton, Icon.pencil, {
						[css.hidden!]: !canEdit ? true : row.map(tree => canEdit(tree))
					}]
				})
				renameButton.addEventListener("click", e => {
					e.stopPropagation()
					onEdit(row as WBox<Tree<T, B>>)
				})
				rowEl.appendChild(renameButton)
			}

			if(onAddToBranch && isBranch){
				const addToBranchButton = tag({
					tag: "button",
					class: [css.rowButton, Icon.plus]
				})
				addToBranchButton.addEventListener("click", e => {
					e.stopPropagation()
					onAddToBranch(row as WBox<TreeBranch<T, B>>)
				})
				rowEl.appendChild(addToBranchButton)
			}

			if(onDelete){
				const deleteButton = tag({
					tag: "button",
					class: [css.rowButton, Icon.close]
				})
				attachDeletionTimerToButton(deleteButton, rowEl, 500, () => {
					dragHandlers?.cancelCurrentDrag()
					onDelete(row)
				})
				rowEl.appendChild(deleteButton)
			}

			const rowData: TreeViewRowData<T, B> = {
				id,
				box: row,
				el: rowEl,
				rowEl,
				isBranch,
				isExpanded,
				childBox: null
			}

			if(isBranch){
				rowEl.addEventListener(
					"click",
					() => {
						(isExpanded as WBox<boolean>).set(!isExpanded.get())
					},
					{passive: true}
				)
				const childBox = rowData.childBox = (row as RBox<TreeBranch<T, B>>).prop("children")
				rowData.el = tag({
					attrs: {"data-row-id": id}
				}, [
					rowEl,
					isExpanded.map(isExpanded => !isExpanded
						? null
						: renderList(childBox, depth + 1)
					)
				])
			}

			if(selectedLeaf && !isBranch){
				rowEl.addEventListener(
					"click",
					() => selectedLeaf.set(id),
					{passive: true}
				)
			}

			if(props.allowReorder){
				dragHandlers!.attachDragHandlers(rowData)
			}

			allRowsById.set(id, rowData)

			return rowData.el
		})])
	}

	return root
}

const Expander = (isExpanded: RBox<boolean>, depth: number) => {
	if(!isWBox(isExpanded)){
		return tag({
			class: [css.expander, css.empty],
			style: {marginLeft: depth + "rem"}
		})
	}
	return tag({
		class: [css.expander, Icon.triangleRight, {
			[css.expanded!]: isExpanded
		}],
		style: {marginLeft: depth + "rem"}
	})
}
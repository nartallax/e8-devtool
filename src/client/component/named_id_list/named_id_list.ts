import {RBox, isArrayItemWBox, isWBox} from "@nartallax/cardboard"
import {Button} from "client/component/button/button"
import {showUserAlert} from "client/component/modal/show_user_alert"
import {Col, Row} from "client/component/row_col/row_col"
import {TreeView} from "client/component/tree_view/tree_view"
import {PromanNamedId} from "data/proman_project"
import {askUserForString} from "client/component/modal/ask_user_for_string"

export interface NamedIdListProps<T extends PromanNamedId> {
	readonly items: RBox<readonly T[]>
	readonly itemName: string
	readonly getName?: (item: T) => string
	readonly makeNew?: () => Promise<T>
	readonly canDelete?: (item: T) => Promise<boolean>
	readonly beforeDelete?: (item: T) => void
	readonly onDblclick?: (item: T) => void
	readonly additionalButtons?: HTMLElement[]
	readonly limit?: number
}

export const NamedIdList = <T extends PromanNamedId>(props: NamedIdListProps<T>) => {

	const buttons = [
		!props.makeNew ? null : Button({
			text: `Add ${props.itemName}`,
			onClick: async() => {
				if(props.limit && props.items.get().length >= props.limit){
					await showUserAlert({
						title: `Too many ${props.itemName}s`,
						text: `No more than ${props.limit} ${props.itemName}s is allowed.`
					})
					return
				}

				if(!isWBox(props.items)){
					throw new Error("Can't add new item if items aren't writable")
				}
				props.items.prependElement(await props.makeNew!())
			}
		}),
		...(props.additionalButtons ?? [])
	]

	const getName = props.getName ?? (item => item.name)
	const result = Col({
		align: "stretch",
		grow: 1
	}, [
		buttons.length === 0 ? null : Row({justify: "start", padding: "bottom", gap: true}, buttons),
		TreeView<T, T>({
			data: isWBox(props.items)
				? props.items.mapArrayElements(item => ({value: item}), tree => tree.value)
				: props.items.mapArrayElements(item => ({value: item})),
			getId: tree => tree.value.id,
			getRowLabel: tree => tree.prop("value").map(getName),
			allowReorder: isWBox(props.items),
			isFlat: true,
			onDblclick: !props.onDblclick ? undefined : box => props.onDblclick!(box.get().value),
			onDelete: !props.canDelete ? undefined : async treeBox => {
				if(props.items.get().length < 2){
					// never delete the last one
					return
				}
				const deletedItem = treeBox.get().value
				if(!(await props.canDelete!(deletedItem))){
					return
				}
				props.beforeDelete?.(deletedItem)
				if(isArrayItemWBox(treeBox)){
					treeBox.deleteArrayElement()
				} else {
					throw new Error("Uhh what?")
				}
			},
			onEdit: !isWBox(props.items) ? undefined : async treeBox => {
				const tree = treeBox.get()
				const name = await askUserForString({
					title: `Enter ${props.itemName} name`,
					placeholder: `New ${props.itemName} name`
				})
				if(name){
					treeBox.set({
						...tree,
						value: {
							...tree.value,
							name
						}
					})
				}
			}
		})
	])

	return result
}
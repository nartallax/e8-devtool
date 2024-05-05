import {capitalize} from "common/capitalize"
import {showModal} from "client/component/modal/modal"
import {NamedIdList, NamedIdListProps} from "client/component/named_id_list/named_id_list"
import {PromanNamedId} from "data/proman_project"

export async function showNamedIdListModal<T extends PromanNamedId>(props: NamedIdListProps<T>): Promise<T | null> {
	let selectedItem: T | null = null

	const modal = showModal({
		height: "75vh",
		width: "50vw",
		title: capitalize(props.itemName) + "s",
		align: "stretch"
	}, [
		NamedIdList({
			onDblclick: item => {
				selectedItem = item
				modal.close("accept")
			},
			...props
		})
	])

	await modal.waitClose()

	return selectedItem
}
import {Form} from "client/components/form/form"
import {Modal} from "client/components/modal/modal"
import {Col} from "client/components/row_col/row_col"
import {StringForestView} from "client/components/tree_view/string_forest_view"
import {UnsavedChanges} from "client/components/unsaved_changes_context/unsaved_changes_context"
import {inputBindProvider, inputGroupProvider} from "client/parts/data_providers/data_providers"
import {ModalSubmitCancelButtons} from "client/parts/modal_buttons/modal_submit_cancel_buttons"
import {getRandomUUID} from "common/uuid"
import {useState} from "react"

type Props = {
	path: string | null
	onClose: (newPath?: string | null) => void
}

export const InputGroupModal = ({path: value, onClose: closeModal}: Props) => {
	const [path, setPath] = useState(value)

	const {getReferrers: getInputBindReferrers} = inputBindProvider.useFetchers()
	const {forestProps, changesProps, onClose} = inputGroupProvider.useEditableForest({
		createItem: () => ({id: getRandomUUID()}),
		getReferrers: inputGroup => [getInputBindReferrers("group", inputGroup.id)],
		onClose: closeModal
	})

	return (
		<UnsavedChanges {...changesProps}>
			<Modal
				header="Input groups"
				onClose={onClose}
				contentWidth={["300px", "50vw", "600px"]}
				contentHeight={["300px", "50vh", "800px"]}>
				<Form onSubmit={() => onClose(path)}>
					<Col gap grow align="stretch">
						<StringForestView
							itemName="input group"
							selectedPath={path}
							onItemClick={path => setPath(path)}
							onItemDoubleclick={path => onClose(path)}
							{...forestProps}
						/>
						<ModalSubmitCancelButtons onCancel={onClose}/>
					</Col>
				</Form>
			</Modal>
		</UnsavedChanges>
	)
}
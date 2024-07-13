import {TitlePart} from "client/components/title_context/title_context"
import {StringForestView} from "client/components/tree_view/string_forest_view"
import {UnsavedChanges} from "client/components/unsaved_changes_context/unsaved_changes_context"
import {inputBindProvider} from "client/parts/data_providers/data_providers"
import {InputBindModal} from "client/parts/input_bind_page/input_bind_modal"
import {CentralColumn} from "client/parts/layouts/central_column"
import {getRandomUUID} from "common/uuid"
import {useState} from "react"

export const InputBindPage = () => {
	const [editedBindPath, setEditedBindPath] = useState<string | null>(null)

	const {forestProps, changesProps} = inputBindProvider.useEditableForest({
		createItem: () => ({
			id: getRandomUUID(), defaultChords: [], group: null, isHold: false
		})
	})

	return (
		<UnsavedChanges {...changesProps}>
			<TitlePart part="Inputs">
				<CentralColumn>
					{!!editedBindPath && <InputBindModal path={editedBindPath} onClose={() => setEditedBindPath(null)}/>}
					<StringForestView
						{...forestProps}
						itemName="bind"
						// TODO: bring this back
						// getItemSublabel={(bind: ProjectInputBind) => {
						// 	const groupName = !bind.group ? null : groupNames.get(bind.group)
						// 	return !groupName ? null : `(${groupName})`
						// }}
						onItemDoubleclick={async path => {
							await changesProps.save()
							setEditedBindPath(path)
						}}
					/>
				</CentralColumn>
			</TitlePart>
		</UnsavedChanges>
	)
}
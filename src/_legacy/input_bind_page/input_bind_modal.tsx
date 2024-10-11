import {CheckboxField} from "client/components/checkbox/checkbox"
import {Form} from "client/components/form/form"
import {Modal} from "client/components/modal/modal"
import {Col} from "client/components/row_col/row_col"
import {ArrayView} from "client/components/tree_view/array_view"
import {UnsavedChanges} from "client/components/unsaved_changes_context/unsaved_changes_context"
import {chordFromString, chordToString} from "client/parts/chord_input/chord_input"
import {inputBindProvider, inputGroupProvider} from "client/parts/data_providers/data_providers"
import {InlineTreeChordEditor} from "client/parts/input_bind_page/inline_tree_chord_editor"
import {InputGroupModal} from "client/parts/input_bind_page/input_group_modal"
import {ModalSubmitCancelButtons} from "client/parts/modal_buttons/modal_submit_cancel_buttons"
import {StringForestIdSelector} from "client/parts/string_forest_id_selector/string_forest_id_selector"
import {getRandomUUID} from "common/uuid"
import {getLastPathPart} from "data/project_utils"

type Props = {
	path: string
	onClose: () => void
}

export const InputBindModal = ({path, onClose}: Props) => {
	const editable = inputBindProvider.useEditableItem(path)
	if(!editable){
		return null
	}

	const {value: bind, setValue: setBind} = editable

	return (
		<UnsavedChanges {...editable.changesProps}>
			<Modal
				header={`Input bind: ${getLastPathPart(path)}`}
				onClose={onClose}
				contentWidth={["300px", "50vw", "600px"]}
				contentHeight={["300px", "50vh", "800px"]}>
				<Form onSubmit={async() => {
					await editable.saveUnsaved()
					onClose()
				}}>
					<Col gap grow stretch>
						<CheckboxField label="Is hold action" value={bind.isHold} onChange={isHold => setBind(bind => ({...bind, isHold}))}/>
						<StringForestIdSelector
							isNullable
							label="Group"
							value={bind.groupId}
							provider={inputGroupProvider}
							onChange={groupId => setBind(bind => ({...bind, groupId}))}
							modal={(path, onClose) => <InputGroupModal onClose={onClose} path={path}/>}
						/>
						<ArrayView
							itemName="default chord"
							createItem={name => ({chord: chordFromString(name), id: getRandomUUID()})}
							getLabel={chord => chordToString(chord.chord)}
							renameItem={(item, name) => ({...item, chord: chordFromString(name)})}
							InlineEditor={InlineTreeChordEditor}
							values={bind.defaultChords}
							setValues={defaultChords => setBind(bind => ({...bind, defaultChords}))}
							getKey={chord => chord.id}
						/>
						<ModalSubmitCancelButtons onCancel={onClose}/>
					</Col>
				</Form>
			</Modal>
		</UnsavedChanges>
	)
}
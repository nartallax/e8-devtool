import {Button} from "client/components/button/button"
import {CheckboxField} from "client/components/checkbox/checkbox"
import {Form} from "client/components/form/form"
import {Modal} from "client/components/modal/modal"
import {Col} from "client/components/row_col/row_col"
import {MappedNamedIdTreeView} from "client/components/tree_view/mapped_named_id_tree_view"
import {chordFromString, chordToString} from "client/parts/chord_input/chord_input"
import {InlineTreeChordEditor} from "client/parts/input_bind_page/inline_tree_chord_editor"
import {InputGroupModal} from "client/parts/input_bind_page/input_group_modal"
import {ModalSubmitCancelButtons} from "client/parts/modal_buttons/modal_submit_cancel_buttons"
import {NamedIdSelector} from "client/parts/named_id_selector/named_id_selector"
import {useProject} from "client/parts/project_context"
import {ProjectInputBind} from "data/project"
import {Icon} from "generated/icons"
import {useState} from "react"

type Props = {
	bind: ProjectInputBind
	onClose: (updatedBind?: ProjectInputBind) => void
}

export const InputBindModal = ({bind, onClose}: Props) => {
	const [project] = useProject()
	const [groupId, setGroupId] = useState(bind.group)
	const [isHold, setIsHold] = useState(bind.isHold)
	const [chords, setChords] = useState(bind.defaultChords)

	return (
		<Modal
			header={`Input bind: ${bind.name}`}
			onClose={onClose}
			contentWidth={["300px", "50vw", "600px"]}
			contentHeight={["300px", "50vh", "800px"]}>
			<Form onSubmit={() => onClose({...bind, isHold, group: groupId, defaultChords: chords})}>
				<Col gap grow stretch>
					<CheckboxField label="Is hold action" value={isHold} onChange={setIsHold}/>
					<NamedIdSelector
						isNullable
						label="Group"
						values={project.inputGroups}
						value={groupId}
						onChange={setGroupId}
						modal={onClose => <InputGroupModal onClose={onClose} value={groupId}/>}
					/>
					<MappedNamedIdTreeView
						values={chords}
						toTree={chord => ({value: {id: chord.id, name: chordToString(chord.chord)}})}
						fromTree={({value}) => ({id: value.id, chord: chordFromString(value.name)})}
						InlineEditor={InlineTreeChordEditor}
						onChange={setChords}
						buttons={controls => <Button text="Add default chord" icon={Icon.plus} onClick={() => controls.addRenameLeaf({})}/>}
					/>
					<ModalSubmitCancelButtons onCancel={onClose}/>
				</Col>
			</Form>
		</Modal>
	)
}
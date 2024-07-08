import {CheckboxField} from "client/components/checkbox/checkbox"
import {Form} from "client/components/form/form"
import {Modal} from "client/components/modal/modal"
import {Col} from "client/components/row_col/row_col"
import {ArrayView} from "client/components/tree_view/array_view"
import {chordFromString, chordToString} from "client/parts/chord_input/chord_input"
import {InlineTreeChordEditor} from "client/parts/input_bind_page/inline_tree_chord_editor"
import {InputGroupModal} from "client/parts/input_bind_page/input_group_modal"
import {MappedForestIdSelector} from "client/parts/mapped_forest_id_selector/mapped_forest_id_selector"
import {ModalSubmitCancelButtons} from "client/parts/modal_buttons/modal_submit_cancel_buttons"
import {useProject} from "client/parts/project_context"
import {getRandomUUID} from "common/uuid"
import {ProjectInputBind} from "data/project"
import {useState} from "react"

type Props = {
	path: string[]
	bind: ProjectInputBind
	onClose: (updatedBind?: ProjectInputBind, path?: string[]) => void
}

export const InputBindModal = ({bind, path, onClose}: Props) => {
	const [project] = useProject()
	const [groupId, setGroupId] = useState(bind.group)
	const [isHold, setIsHold] = useState(bind.isHold)
	const [chords, setChords] = useState(bind.defaultChords)

	return (
		<Modal
			header={`Input bind: ${path[path.length - 1]}`}
			onClose={onClose}
			contentWidth={["300px", "50vw", "600px"]}
			contentHeight={["300px", "50vh", "800px"]}>
			<Form onSubmit={() => onClose({
				...bind, isHold, group: groupId, defaultChords: chords
			}, path)}>
				<Col gap grow stretch>
					<CheckboxField label="Is hold action" value={isHold} onChange={setIsHold}/>
					<MappedForestIdSelector
						isNullable
						label="Group"
						forest={project.inputGroupTree}
						map={project.inputGroups}
						value={groupId}
						onChange={setGroupId}
						modal={onClose => <InputGroupModal onClose={onClose} value={groupId}/>}
					/>
					<ArrayView
						itemName="default chord"
						createItem={name => ({chord: chordFromString(name), id: getRandomUUID()})}
						getLabel={chord => chordToString(chord.chord)}
						renameItem={(item, name) => ({...item, chord: chordFromString(name)})}
						InlineEditor={InlineTreeChordEditor}
						values={chords}
						setValues={setChords}
						getKey={chord => chord.id}
					/>
					{/* <MappedNamedIdTreeView
						values={chords}
						toTree={chord => ({value: {id: chord.id, name: chordToString(chord.chord)}})}
						fromTree={({value}) => ({id: value.id, chord: chordFromString(value.name)})}
						InlineEditor={InlineTreeChordEditor}
						onChange={setChords}
						onLeafCreated={name => ({name, id: getRandomUUID()})}
						buttons={controls => <Button text="Add default chord" icon={Icon.plus} onClick={() => controls.addRenameLeaf()}/>}
					/> */}
					<ModalSubmitCancelButtons onCancel={onClose}/>
				</Col>
			</Form>
		</Modal>
	)
}
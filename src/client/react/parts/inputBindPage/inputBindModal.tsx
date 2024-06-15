import {Button} from "client/react/components/button/button"
import {Checkbox} from "client/react/components/checkbox/checkbox"
import {Form} from "client/react/components/form/form"
import {Modal} from "client/react/components/modal/modal"
import {Col} from "client/react/components/rowCol/rowCol"
import {MappedNamedIdTreeView} from "client/react/components/treeView/mappedNamedIdTreeView"
import {chordFromString, chordToString} from "client/react/parts/chordInput/chordInput"
import {InlineTreeChordEditor} from "client/react/parts/inputBindPage/inlineTreeChordEditor"
import {InputGroupModal} from "client/react/parts/inputBindPage/inputGroupModal"
import {ModalSubmitCancelButtons} from "client/react/parts/modalButtons/modalSubmitCancelButtons"
import {NamedIdSelector} from "client/react/parts/namedIdSelector/namedIdSelector"
import {useProject} from "client/react/parts/projectContext"
import {ProjectInputBind} from "data/project"
import {Icon} from "generated/icons"
import {useState} from "react"

type Props = {
	readonly bind: ProjectInputBind
	readonly onClose: (updatedBind?: ProjectInputBind) => void
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
					<Checkbox label="Is hold action" value={isHold} onChange={setIsHold}/>
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
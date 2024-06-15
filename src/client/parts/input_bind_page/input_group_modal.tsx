import {Button} from "client/components/button/button"
import {Form} from "client/components/form/form"
import {Modal} from "client/components/modal/modal"
import {Col} from "client/components/row_col/row_col"
import {MappedNamedIdTreeView} from "client/components/tree_view/mapped_named_id_tree_view"
import {ModalSubmitCancelButtons} from "client/parts/modal_buttons/modal_submit_cancel_buttons"
import {useProject} from "client/parts/project_context"
import {UUID, zeroUUID} from "common/uuid"
import {ProjectInputGroup} from "data/project"
import {Icon} from "generated/icons"
import {useState} from "react"

type Props = {
	value: UUID | null
	onClose: (newValue?: UUID | null) => void
}

const nullGroup: ProjectInputGroup = {
	id: zeroUUID,
	name: "<none>"
}

export const InputGroupModal = ({value, onClose}: Props) => {
	const [project, setProject] = useProject()
	const [currentValue, setCurrentValue] = useState(value ?? zeroUUID)

	return (
		<Modal
			header="Input groups"
			onClose={onClose}
			contentWidth={["300px", "50vw", "600px"]}
			contentHeight={["300px", "50vh", "800px"]}>
			<Form onSubmit={() => onClose(currentValue === zeroUUID ? null : currentValue)}>
				<Col gap grow align="stretch">
					<MappedNamedIdTreeView
						selectedValue={currentValue}
						values={[nullGroup, ...project.inputGroups]}
						toTree={value => ({value})}
						fromTree={({value}) => value}
						onChange={inputGroups => setProject(project => ({
							...project,
							inputGroups: inputGroups.filter(group => group.id !== zeroUUID)
						}))}
						buttons={controls => <Button text="Add input group" icon={Icon.plus} onClick={() => controls.addRenameLeaf({})}/>}
						onLeafClick={group => setCurrentValue(group.id)}
						onLeafDoubleclick={leaf => onClose(leaf.id === zeroUUID ? null : leaf.id)}
					/>
					<ModalSubmitCancelButtons onCancel={onClose}/>
				</Col>
			</Form>
		</Modal>
	)
}
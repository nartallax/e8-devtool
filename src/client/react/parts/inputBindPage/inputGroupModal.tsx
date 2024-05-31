import {Button} from "client/react/components/button/button"
import {Form} from "client/react/components/form/form"
import {Modal} from "client/react/components/modal/modal"
import {Col} from "client/react/components/rowCol/rowCol"
import {MappedNamedIdTreeView} from "client/react/components/treeView/mappedNamedIdTreeView"
import {ModalSubmitCancelButtons} from "client/react/parts/modalButtons/modalSubmitCancelButtons"
import {useProject} from "client/react/parts/projectContext"
import {UUID, zeroUUID} from "common/uuid"
import {ProjectInputGroup} from "data/project"
import {Icon} from "generated/icons"
import {useState} from "react"

type Props = {
	readonly value: UUID | null
	readonly onClose: (newValue?: UUID | null) => void
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
						onLeafDoubleclick={leaf => onClose(leaf.id === zeroUUID ? null : leaf.id)}/>
					<ModalSubmitCancelButtons onCancel={onClose}/>
				</Col>
			</Form>
		</Modal>
	)
}
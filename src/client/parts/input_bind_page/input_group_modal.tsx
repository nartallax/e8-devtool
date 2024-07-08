import {Form} from "client/components/form/form"
import {useAlert} from "client/components/modal/alert_modal"
import {Modal} from "client/components/modal/modal"
import {Col} from "client/components/row_col/row_col"
import {MappedForestView} from "client/components/tree_view/mapped_forest_view"
import {ModalSubmitCancelButtons} from "client/parts/modal_buttons/modal_submit_cancel_buttons"
import {useProject} from "client/parts/project_context"
import {AbortError} from "client/ui_utils/abort_error"
import {UUID, getRandomUUID} from "common/uuid"
import {Project, ProjectInputGroup} from "data/project"
import {mappedForestToArrayWithPath, mergePath} from "data/project_utils"
import {useState} from "react"

type Props = {
	value: UUID | null
	onClose: (newValue?: UUID | null) => void
}

export const InputGroupModal = ({value, onClose}: Props) => {
	const [project, setProject] = useProject()
	const [inputGroup, setInputGroup] = useState(() =>
		Object.values(project.inputGroups).find(group => group.id === value) ?? null
	)

	const forest = project.inputGroupTree
	const map = project.inputGroups

	const {showAlert} = useAlert()
	const onDelete = (group: ProjectInputGroup) => {
		const msg = getDeletionConflictMessage(project, group.id)
		if(msg){
			void showAlert({
				header: "This input group is in use",
				body: msg
			})
			throw new AbortError("Has conflicts")
		}
	}

	return (
		<Modal
			header="Input groups"
			onClose={onClose}
			contentWidth={["300px", "50vw", "600px"]}
			contentHeight={["300px", "50vh", "800px"]}>
			<Form onSubmit={() => onClose(inputGroup?.id)}>
				<Col gap grow align="stretch">
					<MappedForestView
						getObjectKey={mergePath}
						itemName="input group"
						forest={forest}
						setForest={forest => setProject(project => ({
							...project,
							inputGroupTree: forest
						}))}
						map={map}
						setMap={map => setProject(project => ({
							...project,
							inputGroups: map
						}))}
						createItem={() => ({id: getRandomUUID()})}
						selectedItem={inputGroup}
						onItemClick={setInputGroup}
						onItemDoubleclick={group => onClose(group.id)}
						beforeItemDelete={onDelete}
					/>
					<ModalSubmitCancelButtons onCancel={onClose}/>
				</Col>
			</Form>
		</Modal>
	)
}

const getDeletionConflictMessage = (project: Project, groupId: string): string | null => {
	const binds = mappedForestToArrayWithPath(project.inputBindTree, project.inputBinds).filter(([bind]) => bind.group === groupId)
	const allNames = binds.map(([, path]) => path[path.length - 1])
	if(allNames.length === 0){
		return null
	}
	const firstFewNames = allNames.slice(0, 10)
	if(firstFewNames.length < allNames.length){
		firstFewNames.push(`...and ${allNames.length - firstFewNames.length} more.`)
	}
	const namesStr = firstFewNames.join("\n\t")

	return `This input group is already used in some binds: \n\t${namesStr}\nYou should remove binds from this input group before deleting it.`
}
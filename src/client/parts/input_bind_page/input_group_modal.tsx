import {Form} from "client/components/form/form"
import {useAlert} from "client/components/modal/alert_modal"
import {Modal} from "client/components/modal/modal"
import {Col} from "client/components/row_col/row_col"
import {MappedForestView} from "client/components/tree_view/mapped_forest_view"
import {ModalSubmitCancelButtons} from "client/parts/modal_buttons/modal_submit_cancel_buttons"
import {useProject} from "client/parts/project_context"
import {AbortError} from "client/ui_utils/abort_error"
import {filterObject} from "common/filter_object"
import {UUID, getRandomUUID} from "common/uuid"
import {Project, ProjectInputGroup} from "data/project"
import {mappedForestToArrayWithPath, treePartsToPath} from "data/project_utils"
import {useMemo, useState} from "react"

type Props = {
	value: UUID | null
	onClose: (newValue?: UUID | null) => void
}

// TODO: get rid of this, we have clear button now
const nullGroup: ProjectInputGroup = {
	id: getRandomUUID()
}
const nullName = "<none>"

export const InputGroupModal = ({value, onClose}: Props) => {
	const [project, setProject] = useProject()
	const [inputGroup, setInputGroup] = useState(() =>
		Object.values(project.inputGroups).find(group => group.id === value) ?? nullGroup
	)

	const srcForest = project.inputGroupTree
	const forest = useMemo(() => [
		{value: nullName},
		...srcForest
	], [srcForest])

	const srcMap = project.inputGroups
	const map = useMemo(() => ({
		[nullName]: nullGroup,
		...srcMap
	}), [srcMap])

	const submit = (id?: UUID) => {
		onClose(id === nullGroup.id ? null : id)
	}

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
			onClose={submit}
			contentWidth={["300px", "50vw", "600px"]}
			contentHeight={["300px", "50vh", "800px"]}>
			<Form onSubmit={() => submit(inputGroup?.id)}>
				<Col gap grow align="stretch">
					<MappedForestView
						getObjectKey={treePartsToPath}
						itemName="input group"
						forest={forest}
						setForest={treeWithNull => setProject(project => ({
							...project,
							inputGroupTree: treeWithNull.filter(x => x.value !== nullName)
						}))}
						map={map}
						setMap={mapWithNull => setProject(project => ({
							...project,
							inputGroups: filterObject(mapWithNull, (_, group) => group.id !== nullGroup.id)
						}))}
						createItem={() => ({id: getRandomUUID()})}
						selectedItem={inputGroup}
						onItemClick={setInputGroup}
						onItemDoubleclick={group => submit(group.id)}
						beforeItemDelete={onDelete}
					/>
					<ModalSubmitCancelButtons onCancel={submit}/>
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
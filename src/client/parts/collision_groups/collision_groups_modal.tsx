import {Form} from "client/components/form/form"
import {useAlert} from "client/components/modal/alert_modal"
import {Modal} from "client/components/modal/modal"
import {Col} from "client/components/row_col/row_col"
import {ModalSubmitCancelButtons} from "client/parts/modal_buttons/modal_submit_cancel_buttons"
import {CollisionGridModal} from "client/parts/collision_groups/collision_grid_modal"
import {useProject} from "client/parts/project_context"
import {AbortError} from "client/ui_utils/abort_error"
import {UUID, getRandomUUID} from "common/uuid"
import {Project, ProjectCollisionGroup} from "data/project"
import {useState} from "react"
import {namesOfModelsWhich, mergePath} from "data/project_utils"
import {Button} from "client/components/button/button"
import {Icon} from "generated/icons"
import {MappedForestView} from "client/components/tree_view/mapped_forest_view"

type Props = {
	value: UUID
	onClose: (value?: UUID) => void
}

export const CollisionGroupsModal = ({value: initialValue, onClose}: Props) => {
	const [project, setProject] = useProject()
	const [isCollisonGridOpen, setCollisionGridOpen] = useState(false)
	const [group, setGroup] = useState(() =>
		Object.values(project.collisionGroups).find(group => group.id === initialValue) ?? null
	)
	const {showAlert} = useAlert()

	const onDelete = (group: ProjectCollisionGroup) => {
		const msg = getDeletionConflictMessage(project, group.id)
		if(msg){
			void showAlert({
				header: "This collision group is in use",
				body: msg
			})
			throw new AbortError("Has conflicts")
		}
	}

	return (
		<Modal
			header="Collision groups"
			contentWidth={["300px", "50vw", "600px"]}
			contentHeight={["300px", "50vh", "800px"]}
			onClose={onClose}>
			<Form onSubmit={() => onClose(group?.id)}>
				<Col gap stretch grow>
					{!!isCollisonGridOpen && <CollisionGridModal onClose={() => setCollisionGridOpen(false)}/>}
					<MappedForestView
						getObjectKey={mergePath}
						itemName="collision group"
						forest={project.collisionGroupTree}
						setForest={collisionGroupTree => setProject(project => ({...project, collisionGroupTree}))}
						map={project.collisionGroups}
						setMap={collisionGroups => setProject(project => ({...project, collisionGroups}))}
						beforeItemDelete={onDelete}
						createItem={() => ({id: getRandomUUID()})}
						selectedItem={group}
						onItemClick={group => setGroup(group)}
						onItemDoubleclick={group => onClose(group.id)}
						buttons={() => (
							<Button text="Collision grid" icon={Icon.wrench} onClick={() => setCollisionGridOpen(true)}/>
						)}
					/>
					<ModalSubmitCancelButtons onCancel={onClose}/>
				</Col>
			</Form>
		</Modal>
	)
}

const getDeletionConflictMessage = (project: Project, groupId: string): string | null => {
	const allNames = namesOfModelsWhich(project, model => model.collisionGroupId === groupId)
	if(allNames.length === 0){
		return null
	}
	const firstFewNames = allNames.slice(0, 10)
	if(firstFewNames.length < allNames.length){
		firstFewNames.push(`...and ${allNames.length - firstFewNames.length} more.`)
	}
	const namesStr = firstFewNames.join("\n\t")

	return `This collision group is already used in some models: \n\t${namesStr}\nYou should remove models from this collision group before deleting it.`
}
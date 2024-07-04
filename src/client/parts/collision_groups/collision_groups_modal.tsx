import {Button} from "client/components/button/button"
import {Form} from "client/components/form/form"
import {useAlert} from "client/components/modal/alert_modal"
import {Modal} from "client/components/modal/modal"
import {Col} from "client/components/row_col/row_col"
import {MappedNamedIdTreeView} from "client/components/tree_view/mapped_named_id_tree_view"
import {ModalSubmitCancelButtons} from "client/parts/modal_buttons/modal_submit_cancel_buttons"
import {CollisionGridModal} from "client/parts/collision_groups/collision_grid_modal"
import {useProject} from "client/parts/project_context"
import {AbortError} from "client/ui_utils/abort_error"
import {UUID, getRandomUUID} from "common/uuid"
import {ProjectCollisionGroup, ProjectModel} from "data/project"
import {Icon} from "generated/icons"
import {useState} from "react"

type Props = {
	value: UUID
	onClose: (value?: UUID) => void
}

export const CollisionGroupsModal = ({value: initialValue, onClose}: Props) => {
	const [project, setProject] = useProject()
	const [isCollisonGridOpen, setCollisionGridOpen] = useState(false)
	const [value, setValue] = useState(initialValue)
	const {showAlert} = useAlert()

	const onDelete = (group: ProjectCollisionGroup) => {
		const models = project.models.filter(model => model.collisionGroupId === group.id)
		if(models.length > 0){
			void showAlert({
				header: "This collision group is in use",
				body: getDeletionConflictMessage(models)
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
			<Form onSubmit={() => onClose(value)}>
				<Col gap stretch grow>
					{!!isCollisonGridOpen && <CollisionGridModal onClose={() => setCollisionGridOpen(false)}/>}
					<MappedNamedIdTreeView
						selectedValue={value}
						onLeafClick={leaf => setValue(leaf.id)}
						onLeafDoubleclick={leaf => onClose(leaf.id)}
						values={project.collisionGroups}
						toTree={group => ({value: group})}
						fromTree={leaf => leaf.value}
						onChange={collisionGroups => setProject(project => ({...project, collisionGroups}))}
						onLeafDelete={onDelete}
						canBeChildOf={(_, parent) => !parent}
						onLeafCreated={name => ({name, id: getRandomUUID()})}
						buttons={controls => (
							<>
								<Button text="Add group" icon={Icon.filePlus} onClick={() => controls.addRenameLeaf()}/>
								<Button text="Collision grid" icon={Icon.wrench} onClick={() => setCollisionGridOpen(true)}/>
							</>
						)}
					/>
					<ModalSubmitCancelButtons onCancel={onClose}/>
				</Col>
			</Form>
		</Modal>
	)
}

const getDeletionConflictMessage = (models: ProjectModel[]): string => {
	const firstFewNames = models.slice(0, 10).map(x => x.name)
	if(firstFewNames.length < models.length){
		firstFewNames.push(`...and ${models.length - firstFewNames.length} more.`)
	}
	const namesStr = firstFewNames.join("\n\t")

	return `This collision group is already used in some models: \n\t${namesStr}\nYou should remove models from this collision group before deleting it.`
}
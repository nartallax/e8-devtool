import {Button} from "client/react/components/button/button"
import {Form} from "client/react/components/form/form"
import {AlertModal} from "client/react/components/modal/alertModal"
import {Modal} from "client/react/components/modal/modal"
import {Col} from "client/react/components/rowCol/rowCol"
import {MappedNamedIdTreeView} from "client/react/components/treeView/mappedNamedIdTreeView"
import {ModalSubmitCancelButtons} from "client/react/parts/modalButtons/modalSubmitCancelButtons"
import {CollisionGridModal} from "client/react/parts/modelPage/collisionGroup/collisionGridModal"
import {useProject} from "client/react/parts/projectContext"
import {AbortError} from "client/react/uiUtils/abortError"
import {UUID} from "common/uuid"
import {ProjectCollisionGroup, ProjectModel} from "data/project"
import {Icon} from "generated/icons"
import {useState} from "react"

type Props = {
	readonly value: UUID
	readonly onClose: (value?: UUID) => void
}

export const CollisionGroupModal = ({value: initialValue, onClose}: Props) => {
	const [project, setProject] = useProject()
	const [conflictingModels, setConflictingModels] = useState<ProjectModel[]>([])
	const [isCollisonGridOpen, setCollisionGridOpen] = useState(false)
	const [value, setValue] = useState(initialValue)

	const onDelete = (group: ProjectCollisionGroup) => {
		const models = project.models.filter(model => model.collisionGroupId === group.id)
		if(models.length > 0){
			setConflictingModels(models)
			throw new AbortError("Has conflicts")
		}
	}

	const getDeletionConflictMessage = (models: ProjectModel[]): string => {
		const firstFewNames = models.slice(0, 10).map(x => x.name)
		if(firstFewNames.length < models.length){
			firstFewNames.push(`...and ${models.length - firstFewNames.length} more.`)
		}
		const namesStr = firstFewNames.join("\n\t")

		return `This collision group is already used in some models: \n\t${namesStr}\nYou should remove models from this collision group before deleting it.`
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
					{conflictingModels.length > 0
			&& <AlertModal
				header="This collision group is in use"
				body={getDeletionConflictMessage(conflictingModels)}
				onClose={() => setConflictingModels([])}
			   />}
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
						buttons={controls => (
							<>
								<Button text="Add group" icon={Icon.filePlus} onClick={() => controls.addRenameLeaf({})}/>
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


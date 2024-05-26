import {Button} from "client/react/components/button/button"
import {Validators} from "client/react/components/form/validators"
import {AlertModal} from "client/react/components/modal/alertModal"
import {Col} from "client/react/components/rowCol/rowCol"
import {MappedNamedIdTreeView} from "client/react/components/treeView/mappedNamedIdTreeView"
import {CollisionGridModal} from "client/react/parts/collisionGroupPage/collisionGridModal"
import {useProject} from "client/react/parts/projectContext"
import {AbortError} from "client/react/uiUtils/abortError"
import {UUID} from "common/uuid"
import {CollisionGroup, Project, ProjectEntity} from "data/project"
import {Icon} from "generated/icons"
import {useState} from "react"


export const getCollisionGroupNameValidators = (project: Project, editedGroupId?: UUID) => {
	let groups = project.collisionGroups
	if(editedGroupId){
		groups = groups.filter(group => group.id !== editedGroupId)
	}
	return [
		Validators.nonEmpty(),
		Validators.isUnique({values: groups.map(group => group.name)})
	]
}

export const CollisionGroupPage = () => {
	const [project, setProject] = useProject()
	const [conflictingModels, setConflictingModels] = useState<ProjectEntity[]>([])
	const [isCollisonGridOpen, setCollisionGridOpen] = useState(false)

	const onDelete = (group: CollisionGroup) => {
		const models = project.models.filter(model => model.collisionGroupId === group.id)
		if(models.length > 0){
			setConflictingModels(models)
			throw new AbortError("Has conflicts")
		}
	}

	const getDeletionConflictMessage = (models: ProjectEntity[]): string => {
		const firstFewNames = models.slice(0, 10).map(x => x.name)
		if(firstFewNames.length < models.length){
			firstFewNames.push(`...and ${models.length - firstFewNames.length} more.`)
		}
		const namesStr = firstFewNames.join("\n\t")

		return `This collision group is already used in some models: \n\t${namesStr}\nYou should remove models from this collision group before deleting it.`
	}

	return (
		<Col
			width="100%"
			padding
			align="center"
			grow={1}>
			{conflictingModels.length > 0 && <AlertModal
				header="This collision group is in use"
				body={getDeletionConflictMessage(conflictingModels)}
				onClose={() => setConflictingModels([])}/>}
			{!!isCollisonGridOpen && <CollisionGridModal onClose={() => setCollisionGridOpen(false)}/>}
			<Col
				width={["400px", "50vw", "800px"]}
				grow={1}
				align="stretch"
				gap>
				<MappedNamedIdTreeView
					values={project.collisionGroups}
					toTree={group => ({value: group})}
					fromTree={leaf => leaf.value}
					onChange={collisionGroups => setProject(project => ({...project, collisionGroups}))}
					onLeafDelete={onDelete}
					canBeChildOf={(_, parent) => !parent}
					buttons={controls => (<>
						<Button text="Add group" icon={Icon.filePlus} onClick={() => controls.addRenameLeaf({})}/>
						<Button text="Collision grid" icon={Icon.wrench} onClick={() => setCollisionGridOpen(true)}/>
					</>)}/>
			</Col>
		</Col>
	)
}
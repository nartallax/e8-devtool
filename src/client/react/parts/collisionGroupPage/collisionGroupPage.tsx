import {Button} from "client/react/components/button/button"
import {Validators} from "client/react/components/form/validators"
import {AlertModal} from "client/react/components/modal/alertModal"
import {Col, Row} from "client/react/components/rowCol/rowCol"
import {TreeControls, TreeView} from "client/react/components/treeView/treeView"
import {CollisionGridModal} from "client/react/parts/collisionGroupPage/collisionGridModal"
import {useProject} from "client/react/parts/projectContext"
import {TreePath, moveArrayByPath} from "common/tree"
import {UUID, getRandomUUID} from "common/uuid"
import {CollisionGroup, Project, ProjectEntity} from "data/project"
import {Icon} from "generated/icons"
import {useRef, useState} from "react"


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
	const treeControls = useRef<TreeControls | null>(null)
	const freshlyAddedGroupId = useRef<UUID | null>(null)
	const [conflictingModels, setConflictingModels] = useState<ProjectEntity[]>([])
	const [isCollisonGridOpen, setCollisionGridOpen] = useState(false)

	const addGroup = () => {
		const newGroup: CollisionGroup = {
			id: getRandomUUID(),
			name: ""
		}
		setProject(project => ({
			...project,
			collisionGroups: [newGroup, ...project.collisionGroups]
		}))
		freshlyAddedGroupId.current = newGroup.id

		treeControls?.current?.setInlineEditPath?.([0])
	}

	const renameGroup = (path: TreePath, name: string) => {
		if(path.length !== 1){
			throw new Error("wtf")
		}

		setProject(project => {
			const collisionGroups = [...project.collisionGroups]
			collisionGroups[path[0]!] = {...collisionGroups[path[0]!]!, name}
			return {...project, collisionGroups}
		})

		freshlyAddedGroupId.current = null
	}

	const deleteGroup = (path: TreePath) => {
		const index = path[0]
		if(index === undefined || path.length > 1){
			throw new Error("wat")
		}


		const group = project.collisionGroups[index]!
		const models = project.models.filter(model => model.collisionGroupId === group.id)
		if(models.length > 0){
			setConflictingModels(models)
		} else {
			setProject(project => {
				const collisionGroups = project.collisionGroups.filter(({id}) => id !== group.id)
				const collisionGroupPairs = project.collisionGroupPairs.filter(([a, b]) => a !== group.id && b !== group.id)
				return {...project, collisionGroups, collisionGroupPairs}
			})
		}
	}

	const cancelGroupRenaming = (path: TreePath) => {
		if(path.length !== 1){
			throw new Error("wtf")
		}
		if(project.collisionGroups[path[0]!]!.id === freshlyAddedGroupId.current){
			deleteGroup(path)
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
				<Row justify="start" gap>
					<Button text="Add group" icon={Icon.filePlus} onClick={addGroup}/>
					<Button text="Collision grid" icon={Icon.wrench} onClick={() => setCollisionGridOpen(true)}/>
				</Row>
				<TreeView
					tree={project.collisionGroups.map(group => ({value: group}))}
					controlRef={treeControls}
					getLeafKey={({id}) => id}
					getLeafLabel={({name}) => name}
					leafLabelValidators={group => getCollisionGroupNameValidators(project, group.id)}
					onDrag={(from, to) => setProject(project => {
						const collisionGroups = moveArrayByPath(project.collisionGroups, from, to)
						return {...project, collisionGroups}
					})}
					onBranchLabelEdit={renameGroup}
					onLeafLabelEditCancel={cancelGroupRenaming}
					onLeafDelete={deleteGroup}
					onLeafLabelEdit={(path, name) => {
						if(path.length !== 1){
							throw new Error("how.")
						}
						setProject(project => {
							const collisionGroups = [...project.collisionGroups]
							collisionGroups[path[0]!] = {...collisionGroups[path[0]!]!, name}
							return {...project, collisionGroups}
						})
					}}/>
			</Col>
		</Col>
	)
}
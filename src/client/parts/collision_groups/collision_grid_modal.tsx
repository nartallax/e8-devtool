import {Modal} from "client/components/modal/modal"
import {UUID} from "common/uuid"
import * as css from "./collision_grid_modal.module.scss"
import {useProject} from "client/parts/project_context"
import {useMemo, useState} from "react"
import {ProjectCollisionGroup} from "data/project"
import {Col} from "client/components/row_col/row_col"
import {Form} from "client/components/form/form"
import {ModalSubmitCancelButtons} from "client/parts/modal_buttons/modal_submit_cancel_buttons"
import {Checkbox} from "client/components/checkbox/checkbox"
import {mappedForestToNameMap, mappedForestToArray} from "data/project_utils"

type Props = {
	onClose: () => void
}

type PairMap = Map<UUID, Set<UUID>>

const buildPairMap = (groups: ProjectCollisionGroup[], pairs: [UUID, UUID][]) => {
	const result = new Map<UUID, Set<UUID>>(groups.map(group => [group.id, new Set()]))

	for(const [a, b] of pairs){
		result.get(a)?.add(b)
		result.get(b)?.add(a)
	}

	return result
}

const pairMapToArray = (map: PairMap): [UUID, UUID][] => {
	const result: [UUID, UUID][] = []
	for(const [a, bs] of map.entries()){
		for(const b of bs){
			if(a <= b){
				result.push([a, b])
			}
		}
	}
	return result
}

export const CollisionGridModal = ({onClose}: Props) => {
	const [project, setProject] = useProject()
	const {collisionGroupTree: groupsForest, collisionGroups: groupsMap} = project
	const [nameMap, allGroups] = useMemo(() => [
		mappedForestToNameMap(groupsForest, groupsMap),
		mappedForestToArray(groupsForest, groupsMap)
	], [groupsForest, groupsMap])

	const [pairMap, setPairMap] = useState(buildPairMap(allGroups, project.collisionGroupPairs))

	const onChange = (pair: [UUID, UUID], isEnabled: boolean) => {
		const newMap = new Map([...pairMap.entries()])
		const [a, b] = pair
		if(isEnabled){
			newMap.get(a)?.add(b)
			newMap.get(b)?.add(a)
		} else {
			newMap.get(a)?.delete(b)
			newMap.get(b)?.delete(a)
		}
		setPairMap(newMap)
	}

	const onSubmit = () => {
		setProject(project => {
			const collisionGroupPairs = pairMapToArray(pairMap)
			return {...project, collisionGroupPairs}
		})
		onClose()
	}

	return (
		<Modal
			contentWidth={[null, "300px", "90vw"]}
			contentHeight={[null, "300px", "90vh"]}
			header="Collision grid"
			onClose={onClose}>
			<Form onSubmit={onSubmit}>
				<Col
					align="center"
					justify="center"
					grow={1}
					alignSelf="stretch">
					<div className={css.rows}>
						<div className={css.row} key='labels'>
							{allGroups.map(group =>
								(
									<div className={css.topLabelContainer} key={group.id}>
										<div className={css.topLabel}>
											{nameMap.get(group.id)}
										</div>
									</div>
								))}
						</div>
						{allGroups.map(groupA => (
							<div className={css.row} key={groupA.id}>
								<div key='name'>
									{nameMap.get(groupA.id)}
								</div>
								{allGroups.map(groupB =>
									(
										<PairCheckbox
											key={groupB.id}
											onChange={onChange}
											map={pairMap}
											pair={[groupA.id, groupB.id]}
										/>
									))}
							</div>
						))}
					</div>
				</Col>
				<ModalSubmitCancelButtons onCancel={onClose}/>
			</Form>
		</Modal>
	)
}

type CheckboxProps = {
	pair: [UUID, UUID]
	map: PairMap
	onChange: (pair: [UUID, UUID], isEnabled: boolean) => void
}

const PairCheckbox = ({pair, map, onChange}: CheckboxProps) => {
	return (
		<div className={css.checkboxContainer}>
			<Checkbox value={!!map.get(pair[0])?.has(pair[1])} onChange={isChecked => onChange(pair, isChecked)}/>
		</div>
	)
}
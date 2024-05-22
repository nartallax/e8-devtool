import {Modal} from "client/react/components/modal/modal"
import {UUID} from "common/uuid"
import * as css from "./collisionGridModal.module.scss"
import {useProject} from "client/react/parts/projectContext"
import {useState} from "react"
import {CollisionGroup} from "data/project"
import {Col, Row} from "client/react/components/rowCol/rowCol"
import {Button} from "client/react/components/button/button"

type Props = {
	readonly onClose: () => void
}

type PairMap = Map<UUID, Set<UUID>>

const buildPairMap = (groups: readonly CollisionGroup[], pairs: readonly (readonly [UUID, UUID])[]) => {
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
	const [pairMap, setPairMap] = useState(buildPairMap(project.collisionGroups, project.collisionGroupPairs))

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
			header="Collision grid">
			<Col
				align="center"
				justify="center"
				grow={1}
				alignSelf="stretch">
				<div className={css.rows}>
					<div className={css.row}>
						{project.collisionGroups.map(group =>
							(<div className={css.topLabelContainer} key={group.id}>
								<div className={css.topLabel}>
									{group.name}
								</div>
							</div>))}
					</div>
					{project.collisionGroups.map(groupA => (<div className={css.row} key={groupA.id}>
						<div className={css.sideLabel} key={groupA.id}>
							{groupA.name}
						</div>
						{project.collisionGroups.map(groupB =>
							(<PairCheckbox
								key={groupB.id}
								onChange={onChange}
								map={pairMap}
								pair={[groupA.id, groupB.id]}/>))}
					</div>))}
				</div>
			</Col>
			<Row gap justify="end">
				<Button text="Cancel" onClick={onClose}/>
				<Button text="OK" onClick={onSubmit} hotkey={e => e.key === "Enter"}/>
			</Row>
		</Modal>
	)
}

type CheckboxProps = {
	readonly pair: [UUID, UUID]
	readonly map: PairMap
	readonly onChange: (pair: [UUID, UUID], isEnabled: boolean) => void
}

const PairCheckbox = ({pair, map, onChange}: CheckboxProps) => {
	const isChecked = map.get(pair[0])?.has(pair[1])
	return (
		<input
			className={css.checkbox}
			type="checkbox"
			checked={!!isChecked}
			onChange={() => onChange(pair, !isChecked)}/>
	)
}
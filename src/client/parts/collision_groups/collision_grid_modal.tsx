import {Modal} from "client/components/modal/modal"
import {UUID} from "common/uuid"
import * as css from "./collision_grid_modal.module.scss"
import {useMemo} from "react"
import {ProjectCollisionGroup} from "data/project"
import {Col} from "client/components/row_col/row_col"
import {Form} from "client/components/form/form"
import {ModalSubmitCancelButtons} from "client/parts/modal_buttons/modal_submit_cancel_buttons"
import {Checkbox} from "client/components/checkbox/checkbox"
import {getLastPathPart} from "data/project_utils"
import {collisionGroupProvider, collisionPairsProvider} from "client/parts/data_providers/data_providers"
import {UnsavedChanges} from "client/components/unsaved_changes_context/unsaved_changes_context"
import {reverseMap} from "common/reverse_map"
import {withDataLoaded} from "client/ui_utils/with_data_loaded"

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

export const CollisionGridModal = withDataLoaded(
	(_: Props) => ({
		collisionGroups: collisionGroupProvider.useAsMap(),
		collisionPairsData: collisionPairsProvider.useEditableData()
	}),
	({
		onClose, collisionGroups, collisionPairsData: {
			value: collisionPairs, setValue: setCollisionPairs, save, changesProps
		}
	}) => {
		const groupPathById = reverseMap(collisionGroups, (_, group) => group.id)
		const allGroups = useMemo(() => [...collisionGroups.values()], [collisionGroups])
		const pairMap = useMemo(() => buildPairMap(allGroups, collisionPairs), [allGroups, collisionPairs])

		const onChange = (pair: [UUID, UUID], isEnabled: boolean) => {
			setCollisionPairs(pairs => {
				if(isEnabled){
					return [...pairs, pair]
				} else {
					const [rmA, rmB] = pair
					return pairs.filter(([a, b]) => !((a === rmA && b === rmB) || (a === rmB && b === rmA)))
				}
			})
		}

		const onSubmit = async() => {
			await save()
			onClose()
		}

		return (
			<UnsavedChanges {...changesProps}>
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
													{getLastPathPart(groupPathById.get(group.id)!)}
												</div>
											</div>
										))}
								</div>
								{allGroups.map(groupA => (
									<div className={css.row} key={groupA.id}>
										<div key='name'>
											{getLastPathPart(groupPathById.get(groupA.id)!)}
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
			</UnsavedChanges>
		)
	})

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
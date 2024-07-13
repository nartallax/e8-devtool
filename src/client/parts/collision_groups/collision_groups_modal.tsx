import {Form} from "client/components/form/form"
import {Modal} from "client/components/modal/modal"
import {Col} from "client/components/row_col/row_col"
import {ModalSubmitCancelButtons} from "client/parts/modal_buttons/modal_submit_cancel_buttons"
import {CollisionGridModal} from "client/parts/collision_groups/collision_grid_modal"
import {getRandomUUID} from "common/uuid"
import {useState} from "react"
import {Button} from "client/components/button/button"
import {Icon} from "generated/icons"
import {collisionGroupProvider, modelProvider} from "client/parts/data_providers/data_providers"
import {UnsavedChanges} from "client/components/unsaved_changes_context/unsaved_changes_context"
import {StringForestView} from "client/components/tree_view/string_forest_view"

type Props = {
	path: string
	onClose: (path?: string) => void
}

export const CollisionGroupsModal = ({path: initialPath, onClose: rawOnClose}: Props) => {
	const [isCollisonGridOpen, setCollisionGridOpen] = useState(false)
	const [path, setPath] = useState(initialPath)

	const {getReferrers: getModelReferrers} = modelProvider.useFetchers()

	const {onClose, changesProps, forestProps} = collisionGroupProvider.useEditableForest({
		createItem: () => ({id: getRandomUUID()}),
		getReferrers: group => [getModelReferrers("collisionGroupId", group.id)],
		onClose: rawOnClose
	})

	return (
		<UnsavedChanges {...changesProps}>
			<Modal
				header="Collision groups"
				contentWidth={["300px", "50vw", "600px"]}
				contentHeight={["300px", "50vh", "800px"]}
				onClose={onClose}>
				<Form onSubmit={() => onClose(path)}>
					<Col gap stretch grow>
						{!!isCollisonGridOpen && <CollisionGridModal onClose={() => setCollisionGridOpen(false)}/>}
						<StringForestView
							{...forestProps}
							itemName="collision group"
							selectedPath={path}
							onItemClick={path => setPath(path)}
							onItemDoubleclick={path => onClose(path)}
							buttons={() => (
								<Button text="Collision grid" icon={Icon.wrench} onClick={() => setCollisionGridOpen(true)}/>
							)}
						/>
						<ModalSubmitCancelButtons onCancel={onClose}/>
					</Col>
				</Form>
			</Modal>
		</UnsavedChanges>
	)
}
import {Form} from "client/components/form/form"
import {Modal} from "client/components/modal/modal"
import {Col} from "client/components/row_col/row_col"
import {ModalSubmitCancelButtons} from "client/parts/modal_buttons/modal_submit_cancel_buttons"
import {CollisionGridModal} from "client/parts/collision_groups/collision_grid_modal"
import {getRandomUUID} from "common/uuid"
import {useState} from "react"
import {Button} from "client/components/button/button"
import {Icon} from "generated/icons"
import {collisionGroupProvider} from "client/parts/data_providers/data_providers"
import {StringForestView} from "client/components/tree_view/string_forest_view"

type Props = {
	path: string | null
	onClose: (path?: string | null) => void
}

export const CollisionGroupsModal = ({path: initialPath, onClose}: Props) => {
	const [isCollisonGridOpen, setCollisionGridOpen] = useState(false)
	const [path, setPath] = useState<string | null>(initialPath)

	const forestProps = collisionGroupProvider.useEditableForest({
		createItem: () => ({id: getRandomUUID()})
	})

	if(!forestProps){
		return null
	}

	return (
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
						setSelectedPath={setPath}
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
	)
}
import {Button} from "client/components/button/button"
import {Form} from "client/components/form/form"
import {Modal} from "client/components/modal/modal"
import {Col, Row} from "client/components/row_col/row_col"
import {MappedNamedIdTreeView} from "client/components/tree_view/mapped_named_id_tree_view"
import {ModalSubmitCancelButtons} from "client/parts/modal_buttons/modal_submit_cancel_buttons"
import {Tree} from "common/tree"
import {UUID} from "common/uuid"
import {NamedId, TextureFile} from "data/project"
import {Icon} from "generated/icons"
import {useState} from "react"

type Props = {
	value?: UUID
	onClose: (value?: UUID) => void
	isSelectionModal?: boolean
	textureForest: Tree<TextureFile, NamedId>[]
}

export const TextureTreeModal = ({
	value: initialValue, onClose, textureForest, isSelectionModal = false
}: Props) => {
	const [value, setValue] = useState(initialValue)

	return (
		<Modal
			header="Textures"
			contentWidth={["300px", "50vw", "600px"]}
			contentHeight={["300px", "50vh", "800px"]}
			onClose={onClose}>
			<Form onSubmit={() => onClose(value)}>
				<Col gap stretch grow>
					<MappedNamedIdTreeView
						values={textureForest}
						toTree={x => x}
						fromTree={x => x}
						selectedValue={!isSelectionModal ? undefined : value}
						onLeafClick={!isSelectionModal ? undefined : (leaf: TextureFile) => setValue(leaf.id)}
						onLeafDoubleclick={!isSelectionModal ? undefined : (leaf: TextureFile) => onClose(leaf.id)}
					/>
					{isSelectionModal
						? <ModalSubmitCancelButtons onCancel={onClose}/>
						: <Row justify="end">
							<Button onClick={() => onClose()} icon={Icon.check} text="OK"/>
						</Row>}
				</Col>
			</Form>
		</Modal>
	)
}
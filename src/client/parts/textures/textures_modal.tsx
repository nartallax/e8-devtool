import {Form} from "client/components/form/form"
import {Modal} from "client/components/modal/modal"
import {Col} from "client/components/row_col/row_col"
import {MappedNamedIdTreeView} from "client/components/tree_view/mapped_named_id_tree_view"
import {ModalSubmitCancelButtons} from "client/parts/modal_buttons/modal_submit_cancel_buttons"
import {useTextures} from "client/parts/texture_tree_context"
import {UUID} from "common/uuid"
import {useState} from "react"

type Props = {
	readonly value: UUID
	readonly onClose: (value?: UUID) => void
}

export const TexturesModal = ({value: initialValue, onClose}: Props) => {
	const [value, setValue] = useState(initialValue)
	const {textureTree} = useTextures()

	return (
		<Modal
			header="Textures"
			contentWidth={["300px", "50vw", "600px"]}
			contentHeight={["300px", "50vh", "800px"]}
			onClose={onClose}>
			<Form onSubmit={() => onClose(value)}>
				<Col gap stretch grow>
					<MappedNamedIdTreeView
						values={textureTree}
						toTree={x => x}
						fromTree={x => x}
						selectedValue={value}
						onLeafClick={leaf => setValue(leaf.id)}
						onLeafDoubleclick={leaf => onClose(leaf.id)}
					/>
					<ModalSubmitCancelButtons onCancel={onClose}/>
				</Col>
			</Form>
		</Modal>
	)

}
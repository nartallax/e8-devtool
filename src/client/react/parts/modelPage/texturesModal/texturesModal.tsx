import {Form} from "client/react/components/form/form"
import {Modal} from "client/react/components/modal/modal"
import {Col} from "client/react/components/rowCol/rowCol"
import {MappedNamedIdTreeView} from "client/react/components/treeView/mappedNamedIdTreeView"
import {ModalSubmitCancelButtons} from "client/react/parts/modalButtons/modalSubmitCancelButtons"
import {useTextures} from "client/react/parts/textureTreeContext"
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
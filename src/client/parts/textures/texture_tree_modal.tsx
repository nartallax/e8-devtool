import {Tree} from "@nartallax/forest"
import {Button} from "client/components/button/button"
import {Form} from "client/components/form/form"
import {Modal} from "client/components/modal/modal"
import {Col, Row} from "client/components/row_col/row_col"
import {StringForestView} from "client/components/tree_view/string_forest_view"
import {ModalSubmitCancelButtons} from "client/parts/modal_buttons/modal_submit_cancel_buttons"
import {mergePath} from "data/project_utils"
import {Icon} from "generated/icons"
import {useState} from "react"

type Props = {
	value?: string | null
	onClose: (value?: string | null) => void
	isSelectionModal?: boolean
	textureForest: readonly Tree<string, string>[]
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
					<StringForestView
						makePath={mergePath}
						trees={textureForest}
						selectedPath={!isSelectionModal ? undefined : value}
						onItemClick={!isSelectionModal ? undefined : (leaf: string) => setValue(leaf)}
						onItemDoubleclick={!isSelectionModal ? undefined : (leaf: string) => onClose(leaf)}
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
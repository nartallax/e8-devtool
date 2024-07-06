import {Button} from "client/components/button/button"
import {Form} from "client/components/form/form"
import {Modal} from "client/components/modal/modal"
import {Col, Row} from "client/components/row_col/row_col"
import {MappedForestView} from "client/parts/mapped_forest_view/mapped_forest_view"
import {ModalSubmitCancelButtons} from "client/parts/modal_buttons/modal_submit_cancel_buttons"
import {Tree} from "common/tree"
import {getForestPaths} from "data/project_utils"
import {Icon} from "generated/icons"
import {useMemo, useState} from "react"

type Props = {
	value?: string
	onClose: (value?: string) => void
	isSelectionModal?: boolean
	textureForest: Tree<string, string>[]
}

export const TextureTreeModal = ({
	value: initialValue, onClose, textureForest, isSelectionModal = false
}: Props) => {
	const [value, setValue] = useState(initialValue)

	// it's easier to create map to reuse <MappedForestView> than to create new component just for this
	const map = useMemo(() => {
		const map: Record<string, string> = {}
		for(const [path] of getForestPaths(textureForest)){
			map[path] = path
		}
		return map
	}, [textureForest])

	return (
		<Modal
			header="Textures"
			contentWidth={["300px", "50vw", "600px"]}
			contentHeight={["300px", "50vh", "800px"]}
			onClose={onClose}>
			<Form onSubmit={() => onClose(value)}>
				<Col gap stretch grow>
					<MappedForestView
						forest={textureForest}
						mapObject={map}
						selectedItem={!isSelectionModal ? undefined : value}
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
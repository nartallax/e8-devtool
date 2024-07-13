import {useTextures} from "client/parts/texture_tree_context"
import {TextureTreeModal} from "client/parts/textures/texture_tree_modal"

type Props = {
	value: string | null
	onClose: (value?: string | null) => void
}

export const TexturesModal = ({value, onClose}: Props) => {
	const {textureTree} = useTextures()
	return (
		<TextureTreeModal
			textureForest={textureTree}
			onClose={onClose}
			value={value}
			isSelectionModal
		/>
	)
}
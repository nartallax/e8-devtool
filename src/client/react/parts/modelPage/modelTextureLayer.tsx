import {useModelDisplayContext} from "client/react/parts/modelPage/modelDisplayContext"
import * as css from "./modelDisplay.module.scss"
import {useState} from "react"
import {useTextures} from "client/react/parts/textureTreeContext"

export const ModelTextureLayer = () => {
	const {model, sizeMultiplier} = useModelDisplayContext()
	const {getTextureUrl} = useTextures()
	const [naturalSize, setNaturalSize] = useState({width: 1, height: 1})

	const widthRatio = (sizeMultiplier / naturalSize.width) * model.size.x
	const heightRatio = (sizeMultiplier / naturalSize.height) * model.size.y

	return (
		<img
			className={css.workbenchLayer}
			src={getTextureUrl(model.textureId)}
			style={{
				width: naturalSize.width,
				height: naturalSize.height,
				transform: `translate(-50%, -50%) scale(${widthRatio}, ${heightRatio}) translate(${naturalSize.width / 2}px, ${naturalSize.height / 2}px)`
			}}
			onMouseDown={e => e.preventDefault()}
			onTouchStart={e => e.preventDefault()}
			onLoad={e => {
				const img = e.target
				if(img instanceof HTMLImageElement){
					setNaturalSize({
						width: img.naturalWidth,
						height: img.naturalHeight
					})
				}
			}}
		/>
	)
}
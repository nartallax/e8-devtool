import {useModelDisplayContext} from "client/parts/model_page/model_display/model_display_context"
import * as css from "./model_display.module.css"
import {useState} from "react"
import {useTextures} from "client/parts/texture_tree_context"

export const ModelTextureLayer = () => {
	const {model, inworldUnitPixelSize} = useModelDisplayContext()
	const {getTextureUrl} = useTextures()
	const [naturalSize, setNaturalSize] = useState({width: 1, height: 1})

	const widthRatio = (inworldUnitPixelSize / naturalSize.width) * model.size.x
	const heightRatio = (inworldUnitPixelSize / naturalSize.height) * model.size.y

	if(!model.texturePath){
		return null
	}

	return (
		<img
			className={css.workbenchLayer}
			src={getTextureUrl(model.texturePath)}
			style={{
				width: naturalSize.width,
				height: naturalSize.height,
				transform: `translate(-50%, -50%) scale(${widthRatio}, ${heightRatio}) translate(${naturalSize.width / 2}px, ${naturalSize.height / 2}px)`
			}}
			onMouseDown={e => {
				e.preventDefault()
			}}
			onTouchStart={e => {
				e.preventDefault()
			}}
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
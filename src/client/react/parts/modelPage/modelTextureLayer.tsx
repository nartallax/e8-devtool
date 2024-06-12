import {useModelDisplayContext} from "client/react/parts/modelPage/modelDisplayContext"
import {Api} from "client/api_client"
import * as css from "./modelDisplay.module.scss"

export const ModelTextureLayer = () => {
	const {model, sizeMultiplier} = useModelDisplayContext()

	return (
		<img
			className={css.workbenchLayer}
			src={Api.getTextureUrl(model.texturePath)}
			style={{
				width: sizeMultiplier * model.size.x,
				height: sizeMultiplier * model.size.y
			}}
			onMouseDown={e => e.preventDefault()}
			onTouchStart={e => e.preventDefault()}/>
	)
}
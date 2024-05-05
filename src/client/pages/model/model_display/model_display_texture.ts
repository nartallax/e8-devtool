import {box, calcBox} from "@nartallax/cardboard"
import * as css from "./model_display.module.scss"
import {tag} from "@nartallax/cardboard-dom"
import {PromanApi} from "client/proman_api_client"
import {ModelDisplayLayersState} from "client/pages/model/model_display/model_display_controls"

export const ModelDisplayTexture = (state: ModelDisplayLayersState) => {
	const inworldSize = state.model.prop("size")
	const width = inworldSize.prop("x")
	const height = inworldSize.prop("y")
	const texturePath = state.model.prop("texturePath")

	const natWidth = box(1)
	const natHeight = box(1)

	const img = tag({
		tag: "img",
		class: css.texture,
		attrs: {
			src: texturePath.map(path => !path ? undefined : PromanApi.getTextureUrl(path))
		},
		style: {
			width: natWidth.map(width => width + "px"),
			height: natHeight.map(height => height + "px"),
			transform: calcBox([width, height, natWidth, natHeight],
				(inworldWidth, inworldHeight, nwidth, nheight) => {
					const widthRatio = (state.sizeMultiplier / nwidth) * inworldWidth
					const heightRatio = (state.sizeMultiplier / nheight) * inworldHeight
					return `translate(-50%, -50%) scale(${widthRatio}, ${heightRatio})`
				}
			)
		},
		onLoad: () => {
			natWidth.set(img.naturalWidth)
			natHeight.set(img.naturalHeight)
		}
	})

	img.addEventListener("mousedown", e => e.preventDefault())
	img.addEventListener("touchstart", e => e.preventDefault())

	return img
}
import {box} from "@nartallax/cardboard"
import {svgTag, tag} from "@nartallax/cardboard-dom"
import * as css from "./model_display.module.scss"
import {decomposeShapes} from "data/polygon_decomposition"
import {shapeToSvgPathD} from "client/pages/model/model_display/model_display_data"
import {Toast, showToast} from "client/component/toast/toast"
import {Icon} from "generated/icons"
import {errToString} from "common/err_to_string"
import {ModelDisplayLayersState} from "client/pages/model/model_display/model_display_controls"

export const ModelDisplayDecomp = (state: ModelDisplayLayersState) => {

	// the idea here is to have just one renewable toast
	let toast: Toast | null = null
	const toastText = box("Failed to decompose")
	const tryShowErrorToast = (err: string) => {
		toastText.set(err)
		if(!toast){
			toast = showToast({
				autoRemoveTimeMs: 5000,
				text: toastText,
				icon: Icon.exclamationTriangle,
				onRemove: () => toast = null
			})
		} else {
			toast.renew()
		}
	}

	const decomp = state.shapesStateStack.box
		.map(shapes => {
			try {
				return decomposeShapes(shapes.map(shape => shape.points))
			} catch(e){
				const errStr = errToString(e)
				if(errStr !== toastText.get()){ // this check is here to avoid console spam
					console.error(e)
				}
				tryShowErrorToast(errStr)
				return []
			}
		})

	let decompId = 0
	const decompsWithId = decomp.mapArrayElements(points => ({id: ++decompId, points}))

	const root = svgTag({
		tag: "svg",
		attrs: {
			width: state.workbench.width,
			height: state.workbench.height,
			viewBox: `${-state.workbench.width / 2} ${-state.workbench.height / 2} ${state.workbench.width} ${state.workbench.height}`
		}
	}, [
		decompsWithId.mapArray(x => x.id, decompBox => svgTag(
			{tag: "g"},
			[
				svgTag({
					tag: "path",
					attrs: {
						d: decompBox.prop("points").map(points => shapeToSvgPathD(points, state.sizeMultiplier)),
						"stroke-width": 0.005 * state.sizeMultiplier
					}
				}),
				decompBox.prop("points").mapArrayElements(([x, y]) => svgTag({
					tag: "circle",
					class: css.dot,
					attrs: {
						cx: x * state.sizeMultiplier,
						cy: y * state.sizeMultiplier,
						r: 0.0025 * state.sizeMultiplier
					}
				}))
			]
		))
	])

	return tag({class: css.decomp}, [root])
}
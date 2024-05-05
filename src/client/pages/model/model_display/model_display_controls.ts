import {WBox, calcBox} from "@nartallax/cardboard"
import * as css from "./model_display.module.scss"
import {tag} from "@nartallax/cardboard-dom"
import {Col, Row} from "client/component/row_col/row_col"
import {NumberInput} from "client/component/number_input/number_input"
import {BoolInput} from "client/component/bool_input/bool_input"
import {Button} from "client/component/button/button"
import {ProjectEntity, ProjectShape} from "data/project"
import {Tooltip} from "client/component/tooltip/tooltip"
import {buildObjectShapeByImage} from "client/pages/model/model_display/auto_shape"
import {Api} from "client/api_client"
import {StateStack} from "common/state_stack"
import {WorkbenchState} from "client/component/workbench/workbench"
import {XY} from "@nartallax/e8"
import {UUID} from "crypto"
import {getRandomUUID} from "common/uuid"

export interface ModelDisplayLayersState {
	readonly isGridShowing: WBox<boolean>
	readonly isShapesShowing: WBox<boolean>
	readonly isDecompShowing: WBox<boolean>
	readonly model: WBox<ProjectEntity>
	readonly workbench: WorkbenchState
	readonly currentlyDrawnShapeId: WBox<UUID | null>
	readonly sizeMultiplier: number
	readonly shapesStateStack: StateStack<ProjectShape[]>
	readonly roundToGrain: (value: XY) => XY
}


export const ModelDisplayControls = (state: ModelDisplayLayersState) => {
	return Col({class: css.controls, padding: true}, [

		tag({class: css.label}, ["Zoom"]),
		tag([
			NumberInput({value: state.workbench.zoom.map(
				wbZoom => wbZoom * state.sizeMultiplier,
				iwZoom => iwZoom / state.sizeMultiplier
			)}),
			"px per in-world unit"
		]),

		tag({class: css.label}, ["Grid"]),
		BoolInput({value: state.isGridShowing}),

		tag({class: css.label}, ["Decomp"]),
		Row({justify: "start", gap: true}, [
			BoolInput({value: state.isDecompShowing}),
			Tooltip({text: "Result of decomposing concave shapes into convex shapes."})
		]),


		tag({class: css.label}, ["Shapes"]),
		Row({justify: "start", gap: true}, [
			BoolInput({value: state.isShapesShowing}),
			Button({
				text: "Draw",
				isDisabled: calcBox([state.isShapesShowing, state.currentlyDrawnShapeId], (show, id) => !show || id !== null),
				onClick: () => {
					const shape: ProjectShape = {id: getRandomUUID(), points: []}
					state.shapesStateStack.box.appendElement(shape)
					state.currentlyDrawnShapeId.set(shape.id)
				}
			}),
			Button({
				text: "Auto",
				onClick: async() => {
					const model = state.model.get()
					const texUrl = Api.getTextureUrl(model.texturePath)
					let points = await buildObjectShapeByImage(texUrl, model.size.x, model.size.y, state.sizeMultiplier)
					points = points.map(point => state.roundToGrain(point))
					const shape: ProjectShape = {id: getRandomUUID(), points: points.map(p => [p.x, p.y])}
					state.shapesStateStack.box.appendElement(shape)
					state.shapesStateStack.storeState()
				}
			}),
			Tooltip({text: "Click to select/deselect a polygon.\nDrag to move a point.\nArrow keys to move last moved point one step at a time.\nCtrl+click (or Meta-click) to add or remove point from selected polygon.\nDelete key to remove selected polygon."})
		])

	])
}
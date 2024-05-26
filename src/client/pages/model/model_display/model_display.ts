import {ArrayContext, ArrayItemWBox, WBox, box} from "@nartallax/cardboard"
import {tag} from "@nartallax/cardboard-dom"
import * as css from "./model_display.module.scss"
import {ProjectModel} from "data/project"
import {ModelDisplayControls, ModelDisplayLayersState} from "client/pages/model/model_display/model_display_controls"
import {ModelDisplayTexture} from "client/pages/model/model_display/model_display_texture"
import {ModelDisplayGrid} from "client/pages/model/model_display/model_display_grid"
import {ModelDisplayShapes} from "client/pages/model/model_display/model_display_shapes"
import {ModelDisplayDecomp} from "client/pages/model/model_display/model_display_decomp"
import {StateStack} from "common/state_stack"
import {Workbench} from "client/component/workbench/workbench"
import {configFile} from "client/client_globals"
import {XY} from "@nartallax/e8"
import {UUID} from "crypto"

interface Props {
	readonly selectedModelId: WBox<UUID | null>
	readonly modelContext: ArrayContext<ProjectModel, UUID, ArrayItemWBox<ProjectModel>>
}

export const ModelDisplay = (props: Props) => {
	const isGridShowing = box(false)
	const isShapesShowing = box(true)
	const isDecompShowing = box(false)
	const currentlyDrawnShapeId = box<UUID | null>(null)

	// it shouldn't change anyway
	const inworldUnitPixelSize = configFile.get().inworldUnitPixelSize
	const sizeMultiplier = Math.max(1000, inworldUnitPixelSize * 10)

	function roundNumberToGrain(x: number): number {
		return Math.round(x * inworldUnitPixelSize) / inworldUnitPixelSize
	}

	// rounding is required to kinda-accurately display collision polygon points
	// because points will be rounded like that when writing to binformat of resource pack
	function roundToGrain(xy: XY): XY {
		return {
			x: roundNumberToGrain(xy.x),
			y: roundNumberToGrain(xy.y)
		}
	}

	const wrap: HTMLElement = tag({class: css.modelDisplay}, [
		props.selectedModelId.map(id => {
			if(id === null){
				return tag({class: css.emptyState}, [
					"Select a model to see it here"
				])
			} else {
				return Workbench({
					grow: 1,
					zoom: {
						min: 0.01,
						max: 1,
						default: 0.1,
						speed: 0.25
					},
					width: 1000000,
					height: 1000000,
					content: workbench => {
						const selectedModel = props.modelContext.getBoxForKey(id)
						const shapes = selectedModel.prop("shapes")
						const shapesStateStack = new StateStack(100, shapes)

						const state: ModelDisplayLayersState = {
							isGridShowing, isShapesShowing, isDecompShowing,
							currentlyDrawnShapeId,
							model: selectedModel,
							shapesStateStack,
							sizeMultiplier,
							workbench,
							roundToGrain
						}

						return {
							plainContent: ModelDisplayLayers(state),
							overlayContent: ModelDisplayControls(state)
						}
					}
				})
			}
		})
	])

	return wrap
}

const ModelDisplayLayers = (state: ModelDisplayLayersState) => {
	return tag([
		ModelDisplayTexture(state),
		state.isGridShowing.map(show => !show ? null : ModelDisplayGrid(state)),
		state.isDecompShowing.map(show => !show ? null : ModelDisplayDecomp(state)),
		state.isShapesShowing.map(show => !show ? null : ModelDisplayShapes(state))
	])
}
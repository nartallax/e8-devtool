import {calcBox, unbox} from "@nartallax/cardboard"
import * as css from "./model_display.module.scss"
import {StyleValues, bindBox, tag} from "@nartallax/cardboard-dom"
import {ModelDisplayLayersState} from "client/pages/model/model_display/model_display_controls"

function zoomToGridLevel(zoom: number): number {
	return Math.floor(Math.log10(zoom)) - 1
}

export const ModelDisplayGrid = (state: ModelDisplayLayersState) => {
	// this component is weird and kinda unfinished
	// maybe later I'll think about how to make it better
	// but right now - whatever

	const inworldSize = state.model.prop("size")
	const width = inworldSize.prop("x")
	const height = inworldSize.prop("y")

	const grid = tag({
		class: css.grid,
		style: {
			width: width.map(w => (w * state.sizeMultiplier) + "px"),
			height: height.map(h => (h * state.sizeMultiplier) + "px")
		}
	})

	function line(layout: "h" | "v", gridSpacing: number, pos: number, offset: number = 0): HTMLElement {
		const thickness = Math.min(0.01, gridSpacing / 10) * state.sizeMultiplier
		let style: StyleValues
		offset += Math.floor(thickness / 2)
		if(layout === "h"){
			style = {
				height: thickness + "px",
				top: pos + "px",
				transform: `translateY(-${thickness / 2}px)`,
				left: -offset + "px",
				right: -offset + "px"
			}
		} else {
			style = {
				width: thickness + "px",
				left: pos + "px",
				transform: `translateX(-${thickness / 2}px)`,
				top: -offset + "px",
				bottom: -offset + "px"
			}
		}

		return tag({class: css.line, style})
	}



	const boundingLines: HTMLElement[] = []
	function drawBoundingLines(width: number, height: number): void {
		for(const line of boundingLines){
			line.remove()
		}
		boundingLines.length = 0

		const offset = Math.ceil(state.sizeMultiplier / 4)

		boundingLines.push(line("h", 10, 0))
		boundingLines.push(line("h", 10, height * state.sizeMultiplier))
		boundingLines.push(line("v", 10, 0))
		boundingLines.push(line("v", 10, width * state.sizeMultiplier))

		boundingLines.push(line("h", 10, (height / 2) * state.sizeMultiplier, offset))
		boundingLines.push(line("v", 10, (width / 2) * state.sizeMultiplier, offset))

		for(const line of boundingLines){
			grid.append(line)
		}
	}

	const gridLayers: HTMLElement[][] = []
	function updateGridLayersByZoom(zoom: number): void {
		const level = zoomToGridLevel(zoom)
		while(gridLayers.length > level){
			removeGridLayer()
		}
		while(gridLayers.length < level){
			addGridLayer()
		}
	}

	function removeGridLayer(): void {
		const lastLevel = gridLayers.pop()
		if(!lastLevel){
			return
		}
		for(const el of lastLevel){
			el.remove()
		}
	}

	function addGridLayer(): void {
		const w = unbox(width) * state.sizeMultiplier
		const h = unbox(height) * state.sizeMultiplier
		const levelIndex = gridLayers.length
		const modelSize = Math.max(w, h)
		let gridSpacing = modelSize / (10 ** (levelIndex + 1))
		gridSpacing = 10 ** Math.ceil(Math.log10(gridSpacing))
		const lines: HTMLElement[] = []
		gridLayers.push(lines)

		for(let x = gridSpacing; x < w; x += gridSpacing){
			lines.push(line("v", gridSpacing, x))
		}
		for(let y = gridSpacing; y < h; y += gridSpacing){
			lines.push(line("h", gridSpacing, y))
		}

		console.log({lines, gridSpacing, w, h})
		for(const line of lines){
			grid.append(line)
		}
	}

	function redrawGridLayers(zoom: number): void {
		while(gridLayers.length){
			removeGridLayer()
		}
		updateGridLayersByZoom(zoom)
	}

	bindBox(grid,
		calcBox([width, height], (w, h) => ({w, h})),
		({w, h}) => {
			drawBoundingLines(w, h)
			// redrawGridLayers(unbox(props.zoom))
		}
	)

	// bindBox(grid, props.zoom, updateGridLayersByZoom)
	void redrawGridLayers // we don't need this right now, or maybe ever

	return grid

}
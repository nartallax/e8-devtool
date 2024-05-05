import {WBox, box, calcBox} from "@nartallax/cardboard"
import * as css from "./workbench.module.scss"
import {tag} from "@nartallax/cardboard-dom"
import {boundingRectBox} from "common/on_resize"
import {Container, ContainerProps} from "client/component/row_col/row_col"
import {addMouseDragHandler, pointerEventsToClientCoords, pointerEventsToOffsetCoords} from "common/mouse_drag"
import {XY} from "@nartallax/e8"

export interface WorkbenchState {
	readonly x: WBox<number>
	readonly y: WBox<number>
	readonly zoom: WBox<number>
	readonly width: number
	readonly height: number
	readonly pointerEventToWorkbenchCoords: (e: MouseEvent | TouchEvent) => XY
}

interface Props extends Omit<ContainerProps, "width" | "height"> {
	readonly zoom: {
		readonly min: number
		readonly max: number
		readonly default: number
		readonly speed: number
		readonly box?: WBox<number>
	}
	readonly width: number
	readonly height: number
	readonly content: (state: WorkbenchState) => HTMLElement | {
		plainContent: HTMLElement
		overlayContent: HTMLElement
	}
}

/** Workbench is a draggable/zoomable 2d space,
 * on which you can add custom elements */
export const Workbench = (props: Props) => {
	const container = Container({
		...props,
		class: [props.class, css.workbench],
		// w and h on props are not related to workbench, so we need to clobber them
		// maybe it's bad, but rn we don't need them, so whatever
		width: undefined,
		height: undefined
	})

	const containerSize = boundingRectBox(container)
	const containerWidth = containerSize.prop("width")
	const containerHeight = containerSize.prop("height")
	// plane (aka inworld) coords of center point
	const x = box(0)
	const y = box(0)
	const zoom = props.zoom.box ?? box(props.zoom.default)

	const contentPlain = tag({
		class: css.workbenchContentPlain,
		style: {
			width: props.width + "px",
			height: props.height + "px",
			left: containerWidth.map(w => (-(props.width / 2) + (w / 2)) + "px"),
			top: containerHeight.map(h => (-(props.height / 2) + (h / 2)) + "px"),
			transform: calcBox([x, y, zoom], (x, y, zoom) => `scale(${zoom}) translate(${x}px, ${y}px)`)
		}
	})

	const pointerEventToWorkbenchCoords = (e: MouseEvent | TouchEvent, zm?: number) => {
		zm ??= zoom.get()
		const coords = pointerEventsToOffsetCoords(e, container)!
		coords.x -= containerWidth.get() / 2
		coords.y -= containerHeight.get() / 2
		coords.x /= zm
		coords.y /= zm
		coords.x -= x.get()
		coords.y -= y.get()
		return coords
	}

	const state: WorkbenchState = {
		x, y, zoom, width: props.width, height: props.height,
		pointerEventToWorkbenchCoords
	}

	const content = props.content(state)
	const plainContent = content instanceof HTMLElement ? content : content.plainContent
	const overlayContent = content instanceof HTMLElement ? null : content.overlayContent
	contentPlain.appendChild(plainContent)
	container.appendChild(contentPlain)
	if(overlayContent){
		container.append(overlayContent)
	}

	container.addEventListener("wheel", e => {
		const mult = 1 + (e.deltaY < 0 ? 1 : -1) * props.zoom.speed
		let value = zoom.get()
		if((value < 1 && value * mult > 1) || (value > 1 && value * mult < 1)){
			value = 1
		} else {
			value *= mult
		}
		value = Math.max(props.zoom.min, Math.min(props.zoom.max, value))

		const zoomPointCoordsBeforeZoom = pointerEventToWorkbenchCoords(e)!
		const zoomPointCoordsAfterZoom = pointerEventToWorkbenchCoords(e, value)!
		const dx = zoomPointCoordsBeforeZoom.x - zoomPointCoordsAfterZoom.x
		const dy = zoomPointCoordsBeforeZoom.y - zoomPointCoordsAfterZoom.y

		zoom.set(value)
		x.set(x.get() - dx)
		y.set(y.get() - dy)
	}, {passive: true})

	let lastPos: XY = {x: 0, y: 0}
	addMouseDragHandler({
		distanceBeforeMove: 2,
		element: container,
		start: e => {
			if(e.target !== container && !hasParent(e.target, contentPlain)){
				// this prevents drag from start on overlay items
				// which is usually the right thing to do
				return false
			}
			lastPos = pointerEventsToClientCoords(e)
			return true
		},
		onMove: e => {
			const pos = pointerEventsToClientCoords(e)
			const zm = zoom.get()
			x.set(x.get() + (pos.x - lastPos.x) / zm)
			y.set(y.get() + (pos.y - lastPos.y) / zm)
			lastPos = pos
		}
	})

	return container
}

function hasParent(node: unknown, parent: Node): boolean {
	while(node instanceof Node){
		if(node === parent){
			return true
		}
		if(node === document.body){
			return false
		}
		node = node.parentNode
	}
	return false
}
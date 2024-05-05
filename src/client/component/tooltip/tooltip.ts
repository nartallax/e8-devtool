import {HTMLChildArray, tag} from "@nartallax/cardboard-dom"
import * as css from "./tooltip.module.scss"
import {Icon} from "generated/icons"
import {makeOverlayItem} from "client/component/overlay_item/overlay_item"
import {MRBox, box, constBoxWrap, unbox} from "@nartallax/cardboard"

interface Props {
	readonly text: MRBox<string> | HTMLChildArray
	readonly isTextInteractive?: MRBox<boolean>
}

export const Tooltip = (props: Props) => {
	const visLevel = box(0)

	const result = tag({
		class: [css.tooltipIcon, Icon.questionCircle],
		onMouseover: () => visLevel.set(visLevel.get() + 1),
		onMouseout: () => setTimeout(() => visLevel.set(visLevel.get() - 1), 250)
	})

	makeOverlayItem({
		referenceElement: result,
		overlayPosition: "topLeft",
		referencePosition: "bottomLeft",
		canShiftHorisonally: true,
		isVisible: visLevel.map(level => level > 0),
		body: tag({
			onMouseover: () => visLevel.set(visLevel.get() + (unbox(props.isTextInteractive) ? 1 : 0)),
			onMouseout: () => visLevel.set(visLevel.get() - (unbox(props.isTextInteractive) ? 1 : 0)),
			class: [css.tooltipBody, {
				[css.nonInteractive!]: constBoxWrap(props.isTextInteractive).map(isInteractive => !isInteractive)
			}]
		}, Array.isArray(props.text) ? props.text : [props.text])
	})

	return result
}
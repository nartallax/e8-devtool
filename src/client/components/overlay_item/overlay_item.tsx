import {RowCol} from "client/components/row_col/row_col"
import {CSSProperties, PropsWithChildren} from "react"
import * as css from "./overlay_item.module.scss"

export type Corner = "top-left" | "top-right" | "bottom-left" | "bottom-right"

type Props = Omit<React.ComponentProps<typeof RowCol>, "ref" | "position"> & {
	readonly overlayCorner?: Corner
	readonly anchorCorner?: Corner
	readonly item: React.ReactNode
	readonly isVisible: boolean
}

const calcOffsetDimension = (isHorisontal: boolean, anchorCorner: Corner, overlayCorner: Corner): CSSProperties => {
	const minAttr = isHorisontal ? "left" : "top"
	const maxAttr = isHorisontal ? "right" : "bottom"
	const isAnchorMin = isHorisontal ? anchorCorner.endsWith(minAttr) : anchorCorner.startsWith(minAttr)
	const isOverlayMin = isHorisontal ? overlayCorner.endsWith(minAttr) : overlayCorner.startsWith(minAttr)

	// it's a bit wordy, but better than compressing this into single unreadable formula or nesting conditions
	if(isAnchorMin && isOverlayMin){
		return {[minAttr]: "0"}
	} else if(!isAnchorMin && isOverlayMin){
		return {[minAttr]: "100%"}
	} else if(isAnchorMin && !isOverlayMin){
		return {[maxAttr]: "100%"}
	} else if(!isAnchorMin && !isOverlayMin){
		return {[maxAttr]: "0"}
	} else {
		throw new Error("Uhh what")
	}
}

export const OverlayItem = ({overlayCorner = "top-left", anchorCorner = "bottom-left", item, isVisible, children, ...props}: PropsWithChildren<Props>) => {
	const style = {
		...calcOffsetDimension(true, anchorCorner, overlayCorner),
		...calcOffsetDimension(false, anchorCorner, overlayCorner)
	}

	return (
		<RowCol {...props} position="relative">
			{children}
			{!!isVisible && <div className={css.overlayItem} style={style}>
				{item}
			</div>}
		</RowCol>
	)

}
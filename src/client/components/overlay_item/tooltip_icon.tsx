import {Corner, OverlayItem} from "client/components/overlay_item/overlay_item"
import {Icon} from "generated/icons"
import {PropsWithChildren, useState} from "react"
import * as css from "./overlay_item.module.scss"
import {cn} from "client/ui_utils/classname"

type Props = {
	readonly tooltipCorner?: Corner
	readonly iconCorner?: Corner
	readonly icon?: Icon
	readonly variant?: "default" | "error"
	readonly isHidden?: boolean
	readonly isPreWrapped?: boolean
}

export const TooltipIcon = ({tooltipCorner, iconCorner, icon, variant = "default", isHidden, children, isPreWrapped}: PropsWithChildren<Props>) => {
	const [isVisible, setIsVisible] = useState(false)

	return (
		<OverlayItem
			anchorCorner={iconCorner ?? "bottom-right"}
			overlayCorner={tooltipCorner ?? "bottom-left"}
			item={<div className={cn(css.tooltip, {
				[css.isPreWrapped!]: isPreWrapped
			})}>
				{children}
			</div>}
			isVisible={isVisible}>
			<div
				className={cn(css.tooltipIcon, icon, {
					[css.isError!]: variant === "error",
					[css.isHidden!]: isHidden
				})}
				onMouseLeave={() => setIsVisible(false)}
				onMouseEnter={() => setIsVisible(true)}
			/>
		</OverlayItem>
	)
}
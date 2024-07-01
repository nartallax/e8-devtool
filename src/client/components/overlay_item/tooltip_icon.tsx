import {Corner, OverlayItem} from "client/components/overlay_item/overlay_item"
import {Icon} from "generated/icons"
import {PropsWithChildren, useState} from "react"
import * as css from "./overlay_item.module.scss"
import {cn} from "client/ui_utils/classname"

type Props = {
	tooltipCorner?: Corner
	iconCorner?: Corner
	icon?: Icon
	variant?: "default" | "error" | "disabled"
	isHidden?: boolean
	isPreWrapped?: boolean
}

export const TooltipIcon = ({
	tooltipCorner, iconCorner, icon, variant = "default", isHidden, children, isPreWrapped
}: PropsWithChildren<Props>) => {
	const [isVisible, setIsVisible] = useState(false)

	return (
		<OverlayItem
			anchorCorner={iconCorner ?? "bottom-right"}
			overlayCorner={tooltipCorner ?? "bottom-left"}
			item={<div
				className={cn(css.tooltip, {
					[css.isPreWrapped!]: isPreWrapped
				})}>
				{children}
			</div>}
			isVisible={isVisible}>
			<div
				className={cn(css.tooltipIcon, icon, {
					[css.isError!]: variant === "error",
					[css.isDisabled!]: variant === "disabled",
					[css.isHidden!]: isHidden
				})}
				onMouseLeave={() => setIsVisible(false)}
				onMouseEnter={() => setIsVisible(true)}
			/>
		</OverlayItem>
	)
}
import {MRBox, box, calcBox} from "@nartallax/cardboard"
import {tag} from "@nartallax/cardboard-dom"
import {Icon} from "generated/icons"
import * as css from "./button.module.scss"
import {Spinner} from "client/component/spinner/spinner"
import {attachUiHotkey} from "common/ui_hotkey"

interface Props {
	readonly onClick: () => void | Promise<void>
	readonly text: MRBox<string>
	readonly icon?: MRBox<Icon>
	readonly isDisabled?: MRBox<boolean>
	readonly isPending?: MRBox<boolean>
	/** If enabled, button will allow to click again while previous handler is still running */
	readonly allowRepeatedClick?: boolean
	/** Sets the minimum delay between two button clicks.
	 * If the clicks are more frequent than that, some of them will be ignored.
	 * Only makes sense if allowRepeatedClick is falsy.
	 *
	 * Has some default small value. */
	readonly repeatedClickDelay?: number
	readonly hotkey?: (e: KeyboardEvent) => boolean
}

export const Button = (props: Props) => {
	const repeatedClickDelay = props.repeatedClickDelay ?? 500

	const clicksInProgress = box(0)
	const clickLocksInProgress = box(0)
	const isDisabled = calcBox([props.allowRepeatedClick, props.isDisabled, clicksInProgress, clickLocksInProgress], (allowRepeated, isDisabled, clicks, clickLocks) => {
		if(allowRepeated){
			return !!isDisabled
		} else {
			return !!isDisabled || clickLocks > 0 || clicks > 0
		}
	})
	const isPending = calcBox([props.isPending, clicksInProgress], (a, b) => !!a || b > 0)

	const button = tag({
		tag: "button",
		class: [css.button, {
			[css.disabled!]: isDisabled,
			[css.pending!]: isPending
		}],
		onClick: async() => {
			clicksInProgress.set(clicksInProgress.get() + 1)
			clickLocksInProgress.set(clickLocksInProgress.get() + 1)
			try {
				setTimeout(() => clickLocksInProgress.set(clickLocksInProgress.get() - 1), repeatedClickDelay)
				await Promise.resolve(props.onClick())
			} finally {
				clicksInProgress.set(clicksInProgress.get() - 1)
			}
		}
	}, [
		props.text,
		!props.icon ? null : tag({class: [css.icon, props.icon]}),
		Spinner({class: css.pendingOverlay})
	])

	if(props.hotkey){
		attachUiHotkey(button, props.hotkey, () => {
			void props.onClick()
		})
	}

	return button
}
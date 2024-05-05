import {MRBox, WBox, constBoxWrap} from "@nartallax/cardboard"
import {tag} from "@nartallax/cardboard-dom"
import * as css from "./tabs.module.scss"

interface TabDescription<T> {
	readonly value: T
	readonly label: string
}

interface Props<T> {
	readonly selected: WBox<T>
	readonly options: MRBox<readonly TabDescription<T>[]>
}

export const Tabs = <const T extends string | number | boolean>(props: Props<T>) => {
	return tag({
		class: css.tabs
	}, [constBoxWrap(props.options).mapArray(option => JSON.stringify(option.value), optionBox => {
		const tabValue = optionBox.get().value
		return tag({
			class: [css.tab, {[css.active!]: props.selected.map(value => value === tabValue)}],
			onClick: () => {
				props.selected.set(tabValue)
			}
		}, [optionBox.prop("label")])
	})])
}
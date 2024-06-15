import {Button} from "client/components/button/button"
import {Row} from "client/components/row_col/row_col"
import {Icon} from "generated/icons"

type TabDefinition = {
	isActive: boolean
	key: string
	text?: string
	icon?: Icon
	onClick: () => void
	hotkey?: (e: KeyboardEvent) => boolean
}

type Props = {
	tabs: TabDefinition[]
}

export const Tabs = ({tabs}: Props) => {
	return (
		<Row gap padding={[true, true, false, true]} border="bottom">
			{tabs.map(tab => (
				<Button
					variant="tab"
					key={tab.key}
					onClick={tab.onClick}
					icon={tab.icon}
					text={tab.text}
					hotkey={tab.hotkey}
					isActive={tab.isActive}
				/>
			))}
		</Row>
	)
}
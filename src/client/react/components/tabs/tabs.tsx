import {Button} from "client/react/components/button/button"
import {Row} from "client/react/components/rowCol/rowCol"
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
	readonly tabs: TabDefinition[]
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
					isActive={tab.isActive}/>
			))}
		</Row>
	)
}
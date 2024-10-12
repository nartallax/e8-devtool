import {TitlePart} from "client/components/title_context/title_context"
import {StringForestView} from "client/components/tree_view/string_forest_view"
import {inputBindProvider, inputGroupProvider} from "client/parts/data_providers/data_providers"
import {InputBindModal} from "client/parts/input_bind_page/input_bind_modal"
import {CentralColumn} from "client/parts/layouts/central_column"
import {reverseMap} from "common/reverse_map"
import {getRandomUUID} from "common/uuid"
import {getLastPathPart} from "data/project_utils"
import {useState} from "react"

export const InputBindPage = () => {
	const [editedBindPath, setEditedBindPath] = useState<string | null>(null)

	const forestProps = inputBindProvider.useEditableForest({
		createItem: () => ({
			id: getRandomUUID(), defaultChords: [], groupId: null, isHold: false
		})
	})

	const inputBindMap = inputBindProvider.useAsMap()
	const inputGroupMap = inputGroupProvider.useAsMap()
	const inputGroupIdToPath = !inputGroupMap ? null : reverseMap(inputGroupMap, (_, group) => group.id)

	if(!forestProps){
		return null
	}

	return (
		<TitlePart part="Inputs">
			<CentralColumn>
				{!!editedBindPath && <InputBindModal path={editedBindPath} onClose={() => setEditedBindPath(null)}/>}
				<StringForestView
					{...forestProps}
					itemName="bind"
					getItemSublabel={path => {
						if(!inputBindMap || !inputGroupIdToPath){
							return ""
						}

						const groupId = inputBindMap.get(path)?.groupId ?? null
						if(!groupId){
							return ""
						}

						const groupPath = inputGroupIdToPath.get(groupId)!
						const name = getLastPathPart(groupPath)
						return `(${name})`
					}}
					onItemDoubleclick={async path => {
						setEditedBindPath(path)
					}}
				/>
			</CentralColumn>
		</TitlePart>
	)
}
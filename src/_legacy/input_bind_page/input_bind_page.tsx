
export const InputBindPage = () => {
	return null
	/*
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
				{!!editedBindPath && <InputBindModal
					path={editedBindPath}
					onClose={() => {
						setEditedBindPath(null)
					}}
				/>}
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
					onItemDoubleclick={path => {
						setEditedBindPath(path)
					}}
				/>
			</CentralColumn>
		</TitlePart>
	)
	*/
}
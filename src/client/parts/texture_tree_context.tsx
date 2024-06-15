import {useApi, useApiClient} from "client/parts/api_context"
import {defineContext} from "client/ui_utils/define_context"
import {Tree, getForestLeavesAsArray} from "common/tree"
import {UUID} from "common/uuid"
import {NamedId, TextureFile} from "data/project"
import {useCallback, useMemo} from "react"

export const [TextureTreeProvider, useTextures] = defineContext({
	name: "TextureTreeContext",
	useValue: () => {
		const [textureTree,, {isLoaded}] = useApi([] as Tree<TextureFile, NamedId>[], api => api.getTextureFiles(), [])
		const textureFiles = useMemo(() => getForestLeavesAsArray(textureTree), [textureTree])
		const textureMap = useMemo(() => new Map(textureFiles.map(file => [file.id, file.fullPath])), [textureFiles])
		const apiClient = useApiClient()
		const getTextureUrl = useCallback((id: UUID) => {
			const path = textureMap.get(id)
			if(!path){
				throw new Error("Cannot resolve texture URL by ID: unknown UUID " + id)
			}
			return apiClient.getTextureUrl(path)
		}, [textureMap, apiClient])
		return {textureTree, textureFiles, getTextureUrl, isLoaded}
	}
})
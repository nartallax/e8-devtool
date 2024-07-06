import {useApi, useApiClient} from "client/parts/api_context"
import {defineContext} from "client/ui_utils/define_context"
import {Tree} from "common/tree"
import {getForestPaths} from "data/project_utils"
import {useCallback, useMemo} from "react"

export const [TextureTreeProvider, useTextures] = defineContext({
	name: "TextureTreeContext",
	useValue: () => {
		const [textureForest,, {isLoaded}] = useApi([] as Tree<string, string>[], api => api.getTextureFiles(), [])
		const [texturePaths, textureNames] = useMemo(() => {
			const namesAndPaths = getForestPaths(textureForest)
			const paths = namesAndPaths.map(([path]) => path)
			const pathToName = new Map(namesAndPaths)
			return [paths, pathToName]
		}, [textureForest])

		const getTextureName = useCallback((texturePath: string) => textureNames.get(texturePath) ?? "<unknown texture>", [textureNames])

		const apiClient = useApiClient()
		const getTextureUrl = useCallback((texturePath: string) => {
			return apiClient.getTextureUrl(texturePath)
		}, [apiClient])
		return {
			textureTree: textureForest, texturePaths, getTextureName, getTextureUrl, isLoaded
		}
	}
})
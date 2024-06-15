import {Api} from "client/api_client"
import {useApi} from "client/react/parts/apiContext"
import {Tree, getForestLeavesAsArray} from "common/tree"
import {UUID} from "common/uuid"
import {NamedId, TextureFile} from "data/project"
import {PropsWithChildren, createContext, useCallback, useContext, useMemo} from "react"

const defaultTextureContext = {
	textureTree: [] as Tree<TextureFile, NamedId>[],
	getTextureUrl: (id: UUID) => {
		void id; return ""
	},
	textureFiles: [] as TextureFile[]
}

const TextureTreeContext = createContext(defaultTextureContext)
type TextureContextValue = typeof defaultTextureContext

export const TextureTreeProvider = ({children}: PropsWithChildren) => {
	const [textureTree] = useApi([] as Tree<TextureFile, NamedId>[], api => api.getTextureFiles(), [])
	const textureFiles = useMemo(() => getForestLeavesAsArray(textureTree), [textureTree])
	const textureMap = useMemo(() => new Map(textureFiles.map(file => [file.id, file.fullPath])), [textureFiles])
	const getTextureUrl = useCallback((id: UUID) => {
		const path = textureMap.get(id)
		if(!path){
			throw new Error("Cannot resolve texture URL by ID: unknown UUID " + id)
		}
		return Api.getTextureUrl(path)
	}, [textureMap])


	return (
		<TextureTreeContext.Provider value={{textureTree, textureFiles, getTextureUrl}}>
			{children}
		</TextureTreeContext.Provider>
	)
}

export const useTextures = (): TextureContextValue => {
	return useContext(TextureTreeContext)
}
import {useApi} from "client/react/parts/apiContext"
import {Tree} from "common/tree"
import {NamedId, TextureFile} from "data/project"
import {PropsWithChildren, createContext, useContext} from "react"

const textureTree = {
	textures: [] as Tree<TextureFile, NamedId>[]
}

export const TextureTreeContext = createContext(textureTree)

export const TextureTreeProvider = ({children}: PropsWithChildren) => {
	const [textures] = useApi(api => api.getTextureFiles(), [])

	return (
		<TextureTreeContext.Provider value={{textures: textures ?? []}}>
			{children}
		</TextureTreeContext.Provider>
	)
}

export const useTextureTree = (): Tree<TextureFile, NamedId>[] => {
	return useContext(TextureTreeContext).textures
}
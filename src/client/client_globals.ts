import {box} from "@nartallax/cardboard"
import {Project, NamedId, TextureFile, makeBlankProject, makeBlankProjectModel} from "data/project"
import {ConfigFilePathless, makeEmptyConfigFile} from "server/config"
import {Tree} from "common/tree"

export const project = box<Project>(makeBlankProject())
export const configFile = box<ConfigFilePathless>(makeEmptyConfigFile())

export const textureFiles = box<readonly Tree<TextureFile, NamedId>[]>([])

export const makeEmptyProjectModel = () => makeBlankProjectModel(
	project.get().layers[0]!.id,
	project.get().collisionGroups[0]!.id,
)
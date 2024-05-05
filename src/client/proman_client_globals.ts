import {box} from "@nartallax/cardboard"
import {PromanProject, PromanNamedId, PromanTextureFile, makePromanProject, makePromanProjectModel} from "data/proman_project"
import {PromanConfigFilePathless, makeEmptyPromanConfigFile} from "server/proman_config"
import {Tree} from "common/tree"

export const promanProject = box<PromanProject>(makePromanProject())
export const promanConfigFile = box<PromanConfigFilePathless>(makeEmptyPromanConfigFile())

export const textureFiles = box<readonly Tree<PromanTextureFile, PromanNamedId>[]>([])

export const makeEmptyProjectModel = () => makePromanProjectModel(
	promanProject.get().layers[0]!.id,
	promanProject.get().collisionGroups[0]!.id,
)
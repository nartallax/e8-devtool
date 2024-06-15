import {Project, NamedId, TextureFile} from "data/project"
import {SvgTextureFile} from "data/project_to_resourcepack/atlas_building_utils"
import {Config, ConfigFilePathless, stripCliArgsFromConfig, stripPathsFromConfigFile} from "server/config"
import {Lock} from "common/lock"
import {Tree} from "common/tree"
import {projectToAtlasLayout} from "data/project_to_resourcepack/project_to_resourcepack"
import {XY} from "@nartallax/e8"
import {getActions} from "server/actions"
import {log} from "common/log"

export function getApi(config: Config): Record<string, (...args: any[]) => unknown> {
	const projectManipulationLock = new Lock()

	const actions = getActions(config)

	return {
		async getProject(): Promise<Project> {
			return await actions.getProjectOrCreate()
		},

		async getTextureFiles(): Promise<Tree<TextureFile, NamedId>[]> {
			return await actions.getTextureTree()
		},

		async projectToAtlasLayout(project: Project): Promise<(SvgTextureFile & XY)[]> {
			return await projectToAtlasLayout(project, config)
		},

		async saveAndProduce(project: Project): Promise<void> {
			await projectManipulationLock.withLock(async() => {
				log("Saving...")
				await actions.saveProject(project)
				await actions.produceEverything()
			})
		},

		getConfigFile(): ConfigFilePathless {
			return stripPathsFromConfigFile(stripCliArgsFromConfig(config))
		}
	}
}
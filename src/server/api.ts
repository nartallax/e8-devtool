import {Project, NamedId} from "data/project"
import {SvgTextureFile} from "data/project_to_resourcepack/atlas_building_utils"
import {Lock} from "common/lock"
import {Tree} from "common/tree"
import {projectToAtlasLayout} from "data/project_to_resourcepack/project_to_resourcepack"
import {XY} from "@nartallax/e8"
import {getActions} from "server/actions"
import {log} from "common/log"
import {CLIArgs} from "server/cli"
import {isEnoent} from "common/is_enoent"
import {ApiError} from "common/api_response"
import {readdirAsTree} from "common/readdir_as_tree"

export function getApi(cli: CLIArgs, afterProjectUpdate: (project: Project) => void): Record<string, (...args: any[]) => unknown> {
	const projectManipulationLock = new Lock()

	const actions = getActions(cli)

	return {
		async getProject(): Promise<Project> {
			return await actions.getProject()
		},

		async getTextureFiles(): Promise<Tree<string, string>[]> {
			try {
				return await actions.getTextureTree()
			} catch(e){
				if(!isEnoent(e)){
					throw e
				}
				throw new ApiError("Texture directory not found. Check project configuration.")
			}
		},

		async projectToAtlasLayout(project: Project): Promise<(SvgTextureFile & XY)[]> {
			try {
				return await projectToAtlasLayout(project, actions)
			} catch(e){
				if(!isEnoent(e)){
					throw e
				}
				throw new ApiError("Texture directory not found. Check project configuration.")
			}
		},

		async saveAndProduce(project: Project): Promise<void> {
			await projectManipulationLock.withLock(async() => {
				log("Saving...")
				await actions.saveProject(project)
				await actions.produceEverything()
				afterProjectUpdate(project)
			})
		},

		// TODO: should be string forest
		async getProjectRootForest(): Promise<Tree<NamedId, NamedId>[]> {
			const forest = await readdirAsTree(actions.resolveProjectPath("."))
			return actions.convertTextureForest(forest)
		}
	}
}
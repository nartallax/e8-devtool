import {Project} from "data/project"
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
import {OrderedIdentifiedDirectory} from "server/tree_fs/ordered_identified_directory"
import * as Path from "path"

export async function getApi(cli: CLIArgs, afterProjectUpdate: (project: Project) => void): Promise<Record<string, (...args: any[]) => unknown>> {

	// TODO: cleanup outdated API stuff
	const projectManipulationLock = new Lock()
	const actions = getActions(cli)

	const getProject = async(): Promise<Project> => {
		return await actions.getProject()
	}


	const getTextureFiles = async(): Promise<Tree<string, string>[]> => {
		try {
			return await actions.getTextureTree()
		} catch(e){
			if(!isEnoent(e)){
				throw e
			}
			throw new ApiError("Texture directory not found. Check project configuration.")
		}
	}

	const getAtlasLayout = async(): Promise<(SvgTextureFile & XY)[]> => {
		try {
			const project = await actions.getProject()
			return await projectToAtlasLayout(project, actions)
		} catch(e){
			if(!isEnoent(e)){
				throw e
			}
			throw new ApiError("Texture directory not found. Check project configuration.")
		}
	}

	const saveAndProduce = async(project: Project): Promise<void> => {
		await projectManipulationLock.withLock(async() => {
			log("Saving...")
			await actions.saveProject(project)
			await actions.produceEverything()
			afterProjectUpdate(project)
		})
	}

	const getProjectRootForest = async(): Promise<Tree<string, string>[]> => {
		return await readdirAsTree(actions.resolveProjectPath("."))
	}

	const api: Record<string, (...args: any[]) => unknown> = {
		getProject, getTextureFiles, getAtlasLayout, saveAndProduce, getProjectRootForest
	}

	const addDirToApi = (dir: OrderedIdentifiedDirectory, prefix: string) => {
		api[`${prefix}/create`] = dir.createItem.bind(dir)
		api[`${prefix}/update`] = dir.updateItem.bind(dir)
		api[`${prefix}/createDirectory`] = dir.createDirectory.bind(dir)
		api[`${prefix}/move`] = dir.moveNode.bind(dir)
		api[`${prefix}/rename`] = dir.renameNode.bind(dir)
		api[`${prefix}/delete`] = dir.deleteNode.bind(dir)
		api[`${prefix}/getPathsByFieldValue`] = dir.findPathsOfItemsWithFieldValue.bind(dir)
		api[`${prefix}/getAll`] = dir.getAllItemsAsMap.bind(dir)
		api[`${prefix}/getPathById`] = dir.getPath.bind(dir)
		api[`${prefix}/get`] = dir.getItemById.bind(dir)
		api[`${prefix}/getByPath`] = dir.getItemByPath.bind(dir)
		api[`${prefix}/getForest`] = dir.getForest.bind(dir)
	}

	// TODO: rethink input paths
	// TODO: omit "e8_project" from directory tree when "all files in project directory" are fetched
	const projectDataRoot = Path.resolve(Path.dirname(cli.projectPath), "e8_project")
	log("Loading project...")

	const modelDir = await OrderedIdentifiedDirectory.createAt(Path.resolve(projectDataRoot, "models"), {
		// TODO: proper partitioning here
		getPartitions: part => part.addRestFile("model_def.e8.json")
	})
	addDirToApi(modelDir, "model")

	const particlesDir = await OrderedIdentifiedDirectory.createAt(Path.resolve(projectDataRoot, "particles"), {
		getPartitions: part => part.addRestFile("particle.e8.json")
	})
	addDirToApi(particlesDir, "particle")

	const collisionGroupsDir = await OrderedIdentifiedDirectory.createAt(Path.resolve(projectDataRoot, "collision_groups"), {
		getPartitions: part => part.addRestFile("collision_group.e8.json")
	})
	addDirToApi(collisionGroupsDir, "collisionGroup")

	const layersDir = await OrderedIdentifiedDirectory.createAt(Path.resolve(projectDataRoot, "layers"), {
		getPartitions: part => part.addRestFile("layer.e8.json")
	})
	addDirToApi(layersDir, "layer")

	const inputGroupsDir = await OrderedIdentifiedDirectory.createAt(Path.resolve(projectDataRoot, "input_groups"), {
		getPartitions: part => part.addRestFile("input_group.e8.json")
	})
	addDirToApi(inputGroupsDir, "inputGroup")

	const inputBindsDir = await OrderedIdentifiedDirectory.createAt(Path.resolve(projectDataRoot, "input_binds"), {
		getPartitions: part => part.addRestFile("input_bind.e8.json")
	})
	addDirToApi(inputBindsDir, "inputBind")

	log("Project is loaded.")

	return api
}
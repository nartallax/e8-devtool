import {SvgTextureFile} from "data/project_to_resourcepack/atlas_building_utils"
import {Tree} from "common/tree"
import {projectToAtlasLayout} from "data/project_to_resourcepack/project_to_resourcepack"
import {XY} from "@nartallax/e8"
import {DevtoolActions} from "server/actions"
import {isEnoent} from "common/is_enoent"
import {ApiError} from "common/api_response"
import {readdirAsTree} from "common/readdir_as_tree"
import {OrderedIdentifiedDirectory} from "server/tree_fs/ordered_identified_directory"
import {UUID} from "common/uuid"
import * as Path from "path"

export async function getApi(actions: DevtoolActions): Promise<Record<string, (...args: any[]) => unknown>> {

	// TODO: cleanup outdated API stuff

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
			return await projectToAtlasLayout(actions)
		} catch(e){
			if(!isEnoent(e)){
				throw e
			}
			throw new ApiError("Texture directory not found. Check project configuration.")
		}
	}

	const generateResourcePack = async(): Promise<void> => {
		await actions.produceEverything()
	}

	const getProjectRootForest = async(): Promise<Tree<string, string>[]> => {
		return await readdirAsTree(actions.resolveProjectPath("."), path => {
			return path === actions.projectDataRoot || Path.basename(path).startsWith(".")
		})
	}

	const api: Record<string, (...args: any[]) => unknown> = {
		getProjectConfig: actions.getProjectConfig, updateProjectConfig: actions.updateProjectConfig,
		getCollisionPairs: actions.getCollisionPairs, updateCollisionPairs: actions.getCollisionPairs,
		getTextureFiles, getAtlasLayout, generateResourcePack, getProjectRootForest
	}

	const addDirToApi = <T extends {id: UUID}>(dir: OrderedIdentifiedDirectory<T>, prefix: string) => {
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

	addDirToApi(actions.dirs.models, "model")
	addDirToApi(actions.dirs.particles, "particle")
	addDirToApi(actions.dirs.collsionGroups, "collisionGroup")
	addDirToApi(actions.dirs.layers, "layer")
	addDirToApi(actions.dirs.inputGroups, "inputGroup")
	addDirToApi(actions.dirs.inputBinds, "inputBind")

	return api
}
import {showToast} from "client/component/toast/toast"
import {Project, ProjectEntity, NamedId, TextureFile} from "data/project"
import {SvgTextureFile} from "data/project_to_resourcepack/atlas_building_utils"
import {Icon} from "generated/icons"
import {ConfigFile} from "server/config"
import {ApiClient} from "common/api_client"
import {Tree} from "common/tree"
import {XY} from "@nartallax/e8"

export namespace Api {
	const client = new ApiClient("/api/", "POST", err => showToast({
		icon: Icon.exclamationTriangle,
		text: err.message,
		autoRemoveTimeMs: 15000
	}))

	export const getProject = () => client.call<Project>({name: "getProject"})
	export const saveAndProduce = (project: Project) => client.call({name: "saveAndProduce", body: [project]})
	export const getTextureFiles = () => client.call<Tree<TextureFile, NamedId>[]>({name: "getTextureFiles"})
	export const getTextureUrl = (texturePath: string) => "/textures/" + texturePath
	export const projectToAtlasLayout = (project: Project) => client.call<(SvgTextureFile & XY)[]>({name: "projectToAtlasLayout", body: [project]})
	export const getConfigFile = () => client.call<ConfigFile>({name: "getConfigFile"})

	export const getEntityTree = () => client.call<Tree<string, string>[]>({name: "getEntityTree"})
	export const createEntityDirectory = (path: string[]) => client.call<void>({name: "createEntityDirectory", body: [path]})
	export const renameEntityDirectory = (oldPath: string[], newPath: string[]) => client.call<void>({name: "renameEntityDirectory", body: [oldPath, newPath]})
	export const deleteEntityDirectory = (path: string[]) => client.call<void>({name: "deleteEntityDirectory", body: [path]})
	export const createEntity = (path: string[]) => client.call<ProjectEntity>({name: "createEntity", body: [path]})
	export const renameEntity = (oldPath: string[], newPath: string[]) => client.call<void>({name: "renameEntity", body: [oldPath, newPath]})
	export const updateEntity = (path: string[], entity: ProjectEntity) => client.call<void>({name: "updateEntity", body: [path, entity]})
	export const deleteEntity = (path: string[]) => client.call<void>({name: "deleteEntity", body: [path]})
}
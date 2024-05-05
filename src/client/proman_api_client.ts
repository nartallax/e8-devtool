import {showToast} from "client/component/toast/toast"
import {PromanProject, PromanProjectEntity, PromanNamedId, PromanTextureFile} from "data/proman_project"
import {SvgTextureFile} from "data/project_to_resourcepack/atlas_building_utils"
import {Icon} from "generated/icons"
import {PromanConfigFile} from "server/proman_config"
import {ApiClient} from "common/api_client"
import {Tree} from "common/tree"
import {XY} from "@nartallax/e8"

export namespace PromanApi {
	const client = new ApiClient("/api/", "POST", err => showToast({
		icon: Icon.exclamationTriangle,
		text: err.message,
		autoRemoveTimeMs: 15000
	}))

	export const getProject = () => client.call<PromanProject>({name: "getProject"})
	export const saveAndProduce = (project: PromanProject) => client.call({name: "saveAndProduce", body: [project]})
	export const getTextureFiles = () => client.call<Tree<PromanTextureFile, PromanNamedId>[]>({name: "getTextureFiles"})
	export const getTextureUrl = (texturePath: string) => "/textures/" + texturePath
	export const projectToAtlasLayout = (project: PromanProject) => client.call<(SvgTextureFile & XY)[]>({name: "projectToAtlasLayout", body: [project]})
	export const getConfigFile = () => client.call<PromanConfigFile>({name: "getConfigFile"})

	export const getEntityTree = () => client.call<Tree<string, string>[]>({name: "getEntityTree"})
	export const createEntityDirectory = (path: string[]) => client.call<void>({name: "createEntityDirectory", body: [path]})
	export const renameEntityDirectory = (oldPath: string[], newPath: string[]) => client.call<void>({name: "renameEntityDirectory", body: [oldPath, newPath]})
	export const deleteEntityDirectory = (path: string[]) => client.call<void>({name: "deleteEntityDirectory", body: [path]})
	export const createEntity = (path: string[]) => client.call<PromanProjectEntity>({name: "createEntity", body: [path]})
	export const renameEntity = (oldPath: string[], newPath: string[]) => client.call<void>({name: "renameEntity", body: [oldPath, newPath]})
	export const updateEntity = (path: string[], entity: PromanProjectEntity) => client.call<void>({name: "updateEntity", body: [path, entity]})
	export const deleteEntity = (path: string[]) => client.call<void>({name: "deleteEntity", body: [path]})
}
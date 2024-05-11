import {showToast} from "client/component/toast/toast"
import {Project, NamedId, TextureFile} from "data/project"
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
}
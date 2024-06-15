import {Project, NamedId, TextureFile} from "data/project"
import {SvgTextureFile} from "data/project_to_resourcepack/atlas_building_utils"
import {ConfigFile} from "server/config"
import {ApiClient} from "common/api_client_base"
import {Tree} from "common/tree"
import {XY} from "@nartallax/e8"

export namespace Api {
	const client = new ApiClient("/api/", "POST", err => {
		console.error(err)
		// TODO: toast
	})

	export const getProject = () => client.call<Project>({name: "getProject"})
	export const saveAndProduce = (project: Project) => client.call({name: "saveAndProduce", body: [project]})
	export const getTextureFiles = () => client.call<Tree<TextureFile, NamedId>[]>({name: "getTextureFiles"})
	export const getTextureUrl = (texturePath: string) => "/textures/" + texturePath
	export const projectToAtlasLayout = (project: Project) => client.call<(SvgTextureFile & XY)[]>({name: "projectToAtlasLayout", body: [project]})
	export const getConfigFile = () => client.call<ConfigFile>({name: "getConfigFile"})
	export const getEntityTree = () => client.call<Tree<string, string>[]>({name: "getEntityTree"})
}
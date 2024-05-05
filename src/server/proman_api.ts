import {PromanProject, PromanNamedId, PromanTextureFile} from "data/proman_project"
import {SvgTextureFile} from "data/project_to_resourcepack/atlas_building_utils"
import {PromanConfig, PromanConfigFilePathless, stripCliArgsFromConfig, stripPathsFromConfigFile} from "server/proman_config"
import {Lock} from "common/lock"
import {Tree, isTreeBranch} from "common/tree"
import {readdirAsTree} from "common/readdir_as_tree"
import {projectToAtlasLayout} from "data/project_to_resourcepack/project_to_resourcepack"
import {XY} from "@nartallax/e8"
import {getPromanActions} from "server/proman_actions"
import {getRandomUUID} from "common/uuid"
import {log} from "common/log"

export function getPromanApi(config: PromanConfig): Record<string, (...args: any[]) => unknown> {
	const projectManipulationLock = new Lock()

	const actions = getPromanActions(config)

	return {
		async getProject(): Promise<PromanProject> {
			return await actions.getProjectOrCreate()
		},

		async getTextureFiles(): Promise<Tree<PromanTextureFile, PromanNamedId>[]> {
			const fileTree = await readdirAsTree(config.textureDirectoryPath)

			const convert = (tree: Tree<string, string>, parents: readonly string[]): Tree<PromanTextureFile, PromanNamedId> => {
				if(isTreeBranch(tree)){
					const newParents = [...parents, tree.value]
					return {
						children: tree.children.map(child => convert(child, newParents)),
						value: {
							id: getRandomUUID(),
							name: tree.value
						}
					}
				} else {
					return {value: {
						id: getRandomUUID(),
						fullPath: [...parents, tree.value].join("/"),
						name: tree.value
					}}
				}
			}

			return fileTree.map(tree => convert(tree, []))
		},

		async projectToAtlasLayout(project: PromanProject): Promise<(SvgTextureFile & XY)[]> {
			return await projectToAtlasLayout(project, config)
		},

		async saveAndProduce(project: PromanProject): Promise<void> {
			await projectManipulationLock.withLock(async() => {
				log("Saving...")
				await actions.saveProject(project)
				await actions.produceEverything()
			})
		},

		getConfigFile(): PromanConfigFilePathless {
			return stripPathsFromConfigFile(stripCliArgsFromConfig(config))
		}
	}
}
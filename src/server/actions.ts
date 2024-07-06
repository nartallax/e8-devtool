import {NamedId, Project, TextureFile, makeBlankProject} from "data/project"
import {promises as Fs} from "fs"
import {isEnoent} from "common/is_enoent"
import * as Tempy from "tempy"
import * as Path from "path"
import {projectToResourcePack} from "data/project_to_resourcepack/project_to_resourcepack"
import {projectToTypescript} from "data/project_to_ts"
import {log} from "common/log"
import {encodeResourcePack} from "@nartallax/e8"
import {Tree, isTreeBranch} from "common/tree"
import {getHashUUID} from "common/uuid"
import {readdirAsTree} from "common/readdir_as_tree"
import {CLIArgs} from "server/cli"
import {isPathEqualPath, isPathInsidePath} from "common/is_path_inside_path"

const safeWrite = async(path: string, value: string | Buffer | Uint8Array) => {
	const tmpFile = await Tempy.temporaryWrite(value)
	await Fs.mkdir(Path.dirname(path), {recursive: true})
	await Fs.rename(tmpFile, path)
}

export type DevtoolActions = ReturnType<typeof getActions>

export const getActions = (cli: CLIArgs) => {

	const getProject = async(): Promise<Project> => {
		let project: Project
		try {
			// TODO: bring deepMerge() back
			// const rawProject: Project = JSON.parse(await Fs.readFile(cli.projectPath, "utf-8"))
			// const [mergedProject] = deepMerge(makeBlankProject(), rawProject)
			// project = mergedProject
			project = JSON.parse(await Fs.readFile(cli.projectPath, "utf-8"))
		} catch(e){
			if(!isEnoent(e)){
				throw e
			}

			project = makeBlankProject()
		}

		return project
	}

	const saveProject = async(project: Project) => {
		// pretty-printing JSON here is important for git-friendliness
		// when all project is oneline - any concurrent changes will introduce conflict
		// when it's prettyprinted - git will be able to resolve most conflicts by itself
		// even when not - human will be able to
		await safeWrite(cli.projectPath, JSON.stringify(project, null, "\t"))
	}

	const convertTextureForest = (forest: Tree<string, string>[]): Tree<TextureFile, NamedId>[] => {
		const convert = (tree: Tree<string, string>, parents: string[]): Tree<TextureFile, NamedId> => {
			if(isTreeBranch(tree)){
				const newParents = [...parents, tree.value]
				return {
					children: tree.children.map(child => convert(child, newParents)),
					value: {
						id: getHashUUID(newParents.join("/")),
						name: tree.value
					}
				}
			} else {
				const fullPath = [...parents, tree.value].join("/")
				return {
					value: {
						id: getHashUUID(fullPath),
						fullPath,
						name: tree.value
					}
				}
			}
		}

		return forest.map(tree => convert(tree, []))
	}

	const getTextureTree = async(): Promise<Tree<string, string>[]> => {
		const project = await getProject()
		const fileTree = await readdirAsTree(resolveProjectPath(project.config.textureDirectoryPath))
		return fileTree
	}

	const produceResourcePack = async() => {
		const project = await getProject()
		const resourcePack = await projectToResourcePack(project, actions)
		const bytes = encodeResourcePack(resourcePack)
		await safeWrite(resolveProjectPath(project.config.resourcePackPath), bytes)
	}

	const produceTypescript = async() => {
		const project = await getProject()
		const ts = await projectToTypescript(project, actions)
		await safeWrite(resolveProjectPath(project.config.ts.path), ts)
	}

	const produceEverything = async() => {
		log("Producing resource pack...")
		await produceResourcePack()
		log("Producing typescript..")
		await produceTypescript()
		log("Done.")
	}

	const resolveProjectPath = (path: string): string => {
		const rootDir = Path.dirname(cli.projectPath)
		const result = Path.resolve(rootDir, path)
		if(!isPathInsidePath(result, rootDir) && !isPathEqualPath(result, rootDir)){
			throw new Error("Attempt to break out of root directory: " + result)
		}
		return result
	}

	const actions = {
		getProject,
		saveProject,
		produceResourcePack,
		produceTypescript,
		produceEverything,
		getTextureTree,
		resolveProjectPath,
		convertTextureForest
	}

	return actions
}
import {ProjectCollisionGroup, ProjectConfig, ProjectInputBind, ProjectInputGroup, ProjectLayer, ProjectModel, ProjectParticle, makeBlankProjectConfig} from "data/project"
import {promises as Fs} from "fs"
import {isEnoent} from "common/is_enoent"
import * as Tempy from "tempy"
import * as Path from "path"
import {projectToResourcePack} from "data/project_to_resourcepack/project_to_resourcepack"
import {projectToTypescript} from "data/project_to_ts"
import {log} from "common/log"
import {encodeResourcePack} from "@nartallax/e8"
import {Tree} from "common/tree"
import {readdirAsTree} from "common/readdir_as_tree"
import {CLIArgs} from "server/cli"
import {isPathEqualPath, isPathInsidePath} from "common/is_path_inside_path"
import {UUID} from "common/uuid"
import {AfterOrderedDirectoryModifyEvent, OrderedIdentifiedDirectory} from "server/tree_fs/ordered_identified_directory"

const safeWrite = async(path: string, value: string | Buffer | Uint8Array) => {
	const tmpFile = await Tempy.temporaryWrite(value)
	await Fs.mkdir(Path.dirname(path), {recursive: true})
	await Fs.rename(tmpFile, path)
}

export type DevtoolActions = Awaited<ReturnType<typeof getActions>>

export const getActions = async(cli: CLIArgs, afterConfigUpdate: (config: ProjectConfig) => void) => {
	const projectDataRoot = Path.resolve(cli.projectRoot, "e8_project")

	const projectConfigPath = Path.resolve(projectDataRoot, "config.e8.json")
	let configCache: ProjectConfig | null = null
	const getProjectConfig = async(): Promise<ProjectConfig> => {
		if(!configCache){
			try {
				configCache = JSON.parse(await Fs.readFile(projectConfigPath, "utf-8"))
			} catch(e){
				if(!isEnoent(e)){
					throw e
				}
				configCache = makeBlankProjectConfig()
			}
		}

		return JSON.parse(JSON.stringify(configCache))
	}

	const updateProjectConfig = async(config: ProjectConfig) => {
		configCache = JSON.parse(JSON.stringify(config))
		await Fs.writeFile(projectConfigPath, JSON.stringify(config, null, "\t"), "utf-8")
		afterConfigUpdate(config)
	}

	const collisionPairsPath = Path.resolve(projectDataRoot, "collision_pairs.e8.json")
	const getCollisionPairs = async(): Promise<[UUID, UUID][]> => {
		try {
			return JSON.parse(await Fs.readFile(collisionPairsPath, "utf-8"))
		} catch(e){
			if(!isEnoent(e)){
				throw e
			}
			return []
		}
	}

	const updateCollisionPairs = async(pairs: [UUID, UUID][]) => {
		pairs = pairs.sort(([aa, ab], [ba, bb]) =>
			aa > ba ? 1 : aa < ba ? -1 : ab > bb ? 1 : ab < bb ? -1 : 0
		)
		await Fs.writeFile(collisionPairsPath, JSON.stringify(pairs, null, "\t"), "utf-8")
	}

	const getTextureTree = async(): Promise<Tree<string, string>[]> => {
		const config = await getProjectConfig()
		const fileTree = await readdirAsTree(resolveProjectPath(config.textureDirectoryPath))
		return fileTree
	}

	const produceResourcePack = async() => {
		const config = await actions.getProjectConfig()
		const resourcePack = await projectToResourcePack(actions)
		const bytes = encodeResourcePack(resourcePack)
		await safeWrite(resolveProjectPath(config.resourcePackPath), bytes)
	}

	const produceTypescript = async() => {
		const config = await actions.getProjectConfig()
		const ts = await projectToTypescript(actions)
		await safeWrite(resolveProjectPath(config.ts.path), ts)
	}

	const produceEverything = async() => {
		log("Producing resource pack...")
		await produceResourcePack()
		log("Producing typescript..")
		await produceTypescript()
		log("Done.")
	}

	const resolveProjectPath = (path: string): string => {
		const rootDir = cli.projectRoot
		const result = Path.resolve(rootDir, path)
		if(!isPathInsidePath(result, rootDir) && !isPathEqualPath(result, rootDir)){
			throw new Error("Attempt to break out of root directory: " + result)
		}
		return result
	}

	const afterModified = async(evt: AfterOrderedDirectoryModifyEvent) => {
		if(evt.valueType === "tree" || evt.valueType === "treeOrItem"){
			await actions.produceTypescript()
		}
	}

	log("Loading project...")
	const models = await OrderedIdentifiedDirectory.createAt<ProjectModel>(Path.resolve(projectDataRoot, "models"), {
		// TODO: proper partitioning here
		getPartitions: part => part.addRestFile("model_def.e8.json"),
		afterModified
	})
	const particles = await OrderedIdentifiedDirectory.createAt<ProjectParticle>(Path.resolve(projectDataRoot, "particles"), {
		getPartitions: part => part.addRestFile("particle.e8.json"),
		afterModified
	})
	const collsionGroups = await OrderedIdentifiedDirectory.createAt<ProjectCollisionGroup>(Path.resolve(projectDataRoot, "collision_groups"), {
		getPartitions: part => part.addRestFile("collision_group.e8.json"),
		afterModified
	})
	const layers = await OrderedIdentifiedDirectory.createAt<ProjectLayer>(Path.resolve(projectDataRoot, "layers"), {
		getPartitions: part => part.addRestFile("layer.e8.json"),
		afterModified
	})
	const inputGroups = await OrderedIdentifiedDirectory.createAt<ProjectInputGroup>(Path.resolve(projectDataRoot, "input_groups"), {
		getPartitions: part => part.addRestFile("input_group.e8.json"),
		afterModified
	})
	const inputBinds = await OrderedIdentifiedDirectory.createAt<ProjectInputBind>(Path.resolve(projectDataRoot, "input_binds"), {
		getPartitions: part => part.addRestFile("input_bind.e8.json"),
		afterModified
	})
	log("Project is loaded.")

	const actions = {
		produceResourcePack,
		produceTypescript,
		produceEverything,
		getTextureTree,
		resolveProjectPath,

		dirs: {
			models, particles, collsionGroups, layers, inputGroups, inputBinds
		},

		getProjectConfig,
		updateProjectConfig,
		getCollisionPairs,
		updateCollisionPairs,

		projectDataRoot
	}

	return actions
}
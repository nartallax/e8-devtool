import {ProjectConfig, makeBlankProjectConfig} from "data/project"
import {promises as Fs} from "fs"
import {isEnoent} from "common/is_enoent"
import * as Tempy from "tempy"
import * as Path from "path"
import {projectToTypescript} from "data/project_to_ts"
import {log} from "common/log"
import {CLIArgs} from "server/cli"
import {isPathEqualPath, isPathInsidePath} from "common/is_path_inside_path"
import {AfterOrderedDirectoryModifyEvent, DirectoryController} from "server/tree_fs/directory_controller"
import {ProjectObjectReferrer, getProjectObjectReferrers} from "data/project_referrers"
import {getProjectObjectTypeByFilename} from "data/project_object_types"

const safeWrite = async(path: string, value: string | Buffer | Uint8Array) => {
	// TODO: throw away Tempy, use os.tmpdir()
	const tmpFile = await Tempy.temporaryWrite(value)
	await Fs.mkdir(Path.dirname(path), {recursive: true})
	await Fs.rename(tmpFile, path)
}

export type DevtoolActions = Awaited<ReturnType<typeof getActions>>

export const getActions = async(cli: CLIArgs) => {
	const projectConfigPath = Path.resolve(cli.projectRoot, "config.e8.json")
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
	}

	const produceResourcePack = async() => {
		throw new Error("Not implemented")
		// const config = await actions.getProjectConfig()
		// const resourcePack = await projectToResourcePack(actions)
		// const bytes = encodeResourcePack(resourcePack)
		// await safeWrite(resolveProjectPath(config.resourcePackPath), bytes)
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

	// TODO: do we still need it?
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

	const getObjectReferrers = async(path: string): Promise<ProjectObjectReferrer[]> => {
		const items = await projectDirectoryController.findMatchingItems(
			relPath => !!getProjectObjectTypeByFilename(relPath),
			(item, relPath) => {
				const type = getProjectObjectTypeByFilename(relPath)!
				const refs = getProjectObjectReferrers(item, type)
				return refs.includes(path)
			}
		)

		return items.map(({relPath}) => ({
			path: relPath,
			type: getProjectObjectTypeByFilename(relPath)!
		}))
	}

	log("Loading project...")
	const projectDirectoryController = await DirectoryController.create({
		rootPath: cli.projectRoot,
		afterModified
	})
	log("Project is loaded.")

	const actions = {
		produceResourcePack,
		produceTypescript,
		produceEverything,
		resolveProjectPath,

		projectDirectoryController,

		getProjectConfig,
		updateProjectConfig,
		getObjectReferrers,

		projectRoot: cli.projectRoot
	}

	return actions
}
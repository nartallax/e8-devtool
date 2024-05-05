import {Project, makeBlankProject} from "data/project"
import {Config} from "server/config"
import {promises as Fs} from "fs"
import {isEnoent} from "common/is_enoent"
import * as Tempy from "tempy"
import * as Path from "path"
import {projectToResourcePack} from "data/project_to_resourcepack/project_to_resourcepack"
import {projectToTypescript} from "data/project_to_ts"
import {log} from "common/log"
import {encodeResourcePack} from "@nartallax/e8"

export const getActions = (config: Config) => {
	const getProject = async(): Promise<Project> => {
		return JSON.parse(await Fs.readFile(config.projectPath, "utf-8"))
	}

	const getProjectOrCreate = async(): Promise<Project> => {
		let project: Project
		try {
			project = await getProject()
		} catch(e){
			if(!isEnoent(e)){
				throw e
			}

			project = makeBlankProject()
		}

		return project
	}

	const safeWrite = async(path: string, value: string | Buffer | Uint8Array) => {
		const tmpFile = await Tempy.temporaryWrite(value)
		await Fs.mkdir(Path.dirname(path), {recursive: true})
		await Fs.rename(tmpFile, path)
	}

	const saveProject = async(project: Project) => {
		// pretty-printing JSON here is important for git-friendliness
		// when all project is oneline - any concurrent changes will introduce conflict
		// when it's prettyprinted - git will be able to resolve most conflicts by itself
		// even when not - human will be able to
		await safeWrite(config.projectPath, JSON.stringify(project, null, "\t"))
	}

	const produceResourcePack = async() => {
		const project = JSON.parse(await Fs.readFile(config.projectPath, "utf-8"))
		const resourcePack = await projectToResourcePack(project, config)
		const bytes = encodeResourcePack(resourcePack)
		await safeWrite(config.resourcePackPath, bytes)
	}

	const produceTypescript = async() => {
		const project = JSON.parse(await Fs.readFile(config.projectPath, "utf-8"))
		const ts = await projectToTypescript(project, config)
		await safeWrite(config.ts.path, ts)
	}

	const produceEverything = async() => {
		log("Producing resource pack...")
		await produceResourcePack()
		log("Producing typescript..")
		await produceTypescript()
		log("Done.")
	}

	return {
		getProject,
		getProjectOrCreate,
		saveProject,
		produceResourcePack,
		produceTypescript,
		produceEverything
	}


}
import {PromanProject, makePromanProject} from "data/proman_project"
import {PromanConfig} from "server/proman_config"
import {promises as Fs} from "fs"
import {isEnoent} from "common/is_enoent"
import * as Tempy from "tempy"
import * as Path from "path"
import {promanProjectToResourcePack} from "data/project_to_resourcepack/project_to_resourcepack"
import {promanProjectToTypescript} from "data/project_to_ts"
import {log} from "common/log"
import {encodeResourcePack} from "@nartallax/e8"

export const getPromanActions = (config: PromanConfig) => {
	const getProject = async(): Promise<PromanProject> => {
		return JSON.parse(await Fs.readFile(config.projectPath, "utf-8"))
	}

	const getProjectOrCreate = async(): Promise<PromanProject> => {
		let project: PromanProject
		try {
			project = await getProject()
		} catch(e){
			if(!isEnoent(e)){
				throw e
			}

			project = makePromanProject()
		}

		return project
	}

	const safeWrite = async(path: string, value: string | Buffer | Uint8Array) => {
		const tmpFile = await Tempy.temporaryWrite(value)
		await Fs.mkdir(Path.dirname(path), {recursive: true})
		await Fs.rename(tmpFile, path)
	}

	const saveProject = async(project: PromanProject) => {
		// pretty-printing JSON here is important for git-friendliness
		// when all project is oneline - any concurrent changes will introduce conflict
		// when it's prettyprinted - git will be able to resolve most conflicts by itself
		// even when not - human will be able to
		await safeWrite(config.projectPath, JSON.stringify(project, null, "\t"))
	}

	const produceResourcePack = async() => {
		const project = JSON.parse(await Fs.readFile(config.projectPath, "utf-8"))
		const resourcePack = await promanProjectToResourcePack(project, config)
		const bytes = encodeResourcePack(resourcePack)
		await safeWrite(config.resourcePackPath, bytes)
	}

	const produceTypescript = async() => {
		const project = JSON.parse(await Fs.readFile(config.projectPath, "utf-8"))
		const ts = await promanProjectToTypescript(project, config)
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
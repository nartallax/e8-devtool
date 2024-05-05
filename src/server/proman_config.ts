import {CLIArgs, getCliArgs} from "server/proman_cli"
import {deepMerge} from "common/deep_merge"
import {deepOmit} from "common/deep_omit"
import {DeepPartialFlags, deepResolvePaths} from "common/deep_resolve_paths"
import {isEnoent} from "common/is_enoent"
import {promises as Fs} from "fs"
import * as Path from "path"

export interface PromanConfigFilePathless {
	readonly host?: string
	readonly port: number
	/** Approximate amount of pixels for one inworld unit.
	 * This setting affects precision and some inferred values
	 * Keep this around 100, and make the textures accordingly */
	readonly inworldUnitPixelSize: number
}

export interface PromanConfigFile extends PromanConfigFilePathless {
	readonly projectPath: string
	readonly resourcePackPath: string
	readonly textureDirectoryPath: string
	/** Path that contains classes related to entities */
	readonly entityClassesDirectoryPath: string
	/** Path that contains various definitions created by proman */
	readonly projectPartsDirectoryPath: string
	readonly ts: PromanConfigTsNames & {
		readonly path: string
	}
}

export interface PromanConfigTsNames {
	readonly entityEnumName: string
	readonly inputBindSetEnumName: string
	readonly inputBindsNamespaceName: string
	readonly loaderVariableName: string
	readonly particleEnumName: string
}

const configFilePathProps: DeepPartialFlags<PromanConfigFile> = {
	projectPath: true,
	resourcePackPath: true,
	textureDirectoryPath: true,
	entityClassesDirectoryPath: true,
	ts: {
		path: true
	}
}

export type PromanConfig = CLIArgs & PromanConfigFile

export function makeEmptyPromanConfigFile(): PromanConfigFile {
	return {
		entityClassesDirectoryPath: "",
		inworldUnitPixelSize: 100,
		port: 24765,
		projectPath: "./project.e8.json",
		resourcePackPath: "./generated/resource_pack.e8.bin",
		textureDirectoryPath: "./textures",
		projectPartsDirectoryPath: "./project_entities",
		ts: {
			path: "./generated/resource_pack_content.e8.ts",
			inputBindSetEnumName: "BindSet",
			inputBindsNamespaceName: "BindSets",
			loaderVariableName: "loader",
			entityEnumName: "Entities",
			particleEnumName: "Particles"
		}
	}
}

export function stripCliArgsFromConfig(config: PromanConfig): PromanConfigFile {
	const result: any = config
	for(const key in getCliArgs()){
		delete result[key]
	}
	return result
}

export function stripPathsFromConfigFile(config: PromanConfigFile): PromanConfigFilePathless {
	return deepOmit(config, configFilePathProps)
}

export async function getPromanConfig(): Promise<PromanConfig> {
	const cliArgs = getCliArgs()
	let configFile: PromanConfigFile
	let shouldWrite: boolean

	try {
		const rawConfigFile: Partial<PromanConfigFile> = JSON.parse(await Fs.readFile(cliArgs.configPath, "utf-8"))
		const [mergedConfigFile, hasChange] = deepMerge(makeEmptyPromanConfigFile(), rawConfigFile)
		shouldWrite = hasChange
		configFile = mergedConfigFile
	} catch(e){
		if(!isEnoent(e)){
			throw e
		}
		configFile = makeEmptyPromanConfigFile()
		shouldWrite = true
	}

	if(shouldWrite){
		await Fs.writeFile(cliArgs.configPath, JSON.stringify(configFile, null, 4), "utf-8")
	}

	configFile = deepResolvePaths(Path.dirname(cliArgs.configPath), configFile, configFilePathProps)

	return {
		...cliArgs,
		...configFile
	}
}
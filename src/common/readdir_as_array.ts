import {promises as Fs} from "fs"
import * as Path from "path"

interface Params {
	excludeDirectories?: boolean
}

/** Recursively readdir() target directory.
 * @returns array of absolute paths */
export async function readdirAsArray(dir: string, params: Params = {}, resultContainer: string[] = []): Promise<string[]> {
	const entries = await Fs.readdir(dir)

	await Promise.all(entries.map(async entry => {
		const fullPath = Path.resolve(dir, entry)
		const stat = await Fs.stat(fullPath)
		if(stat.isDirectory()){
			if(!params.excludeDirectories){
				resultContainer.push(fullPath)
			}
			await readdirAsArray(fullPath, params, resultContainer)
		} else {
			resultContainer.push(fullPath)
		}
	}))

	return resultContainer
}
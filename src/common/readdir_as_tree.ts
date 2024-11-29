import {Tree} from "@nartallax/forest"
import {nonNull} from "common/non_null"
import {promises as Fs} from "fs"
import * as Path from "path"

export async function readdirAsTree(dir: string, shouldOmit?: (fullPath: string) => boolean): Promise<readonly Tree<string, string>[]> {
	const entries = await Fs.readdir(dir)
	return (await Promise.all(entries.map(async entry => {
		const fullPath = Path.resolve(dir, entry)
		if(shouldOmit?.(fullPath)){
			return null
		}
		const stat = await Fs.stat(fullPath)
		if(stat.isDirectory()){
			return {value: entry, children: await readdirAsTree(fullPath)}
		} else {
			return {value: entry}
		}
	}))).filter(nonNull)
}
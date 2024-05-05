import {Tree} from "common/tree"
import {promises as Fs} from "fs"
import * as Path from "path"

export async function readdirAsTree(dir: string): Promise<Tree<string, string>[]> {
	const entries = await Fs.readdir(dir)
	return await Promise.all(entries.map(async entry => {
		const fullPath = Path.resolve(dir, entry)
		const stat = await Fs.stat(fullPath)
		if(stat.isDirectory()){
			return {value: entry, children: await readdirAsTree(fullPath)}
		} else {
			return {value: entry}
		}
	}))
}
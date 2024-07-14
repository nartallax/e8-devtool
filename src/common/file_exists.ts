import {isEnoent} from "common/is_enoent"
import {promises as Fs} from "fs"

export async function directoryExists(path: string): Promise<boolean> {
	try {
		const stat = await Fs.stat(path)
		if(!stat.isDirectory()){
			throw new Error(path + " exists, but it's not a directory! Don't know how to react to that.")
		}
		return true
	} catch(e){
		if(isEnoent(e)){
			return false
		}
		throw e
	}
}

export async function fileExists(path: string): Promise<boolean> {
	try {
		const stat = await Fs.stat(path)
		if(!stat.isFile()){
			throw new Error(path + " exists, but it's not a file! Don't know how to react to that.")
		}
		return true
	} catch(e){
		if(isEnoent(e)){
			return false
		}
		throw e
	}
}
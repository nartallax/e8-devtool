import {omit} from "common/omit"
import {pick} from "common/pick"
import {promises as Fs} from "fs"
import * as Path from "path"

type Partition<T, K extends keyof T> = Serializer<T, K> & {
	fields: K[]
}

type Serializer<T, K extends keyof T> = {
	serialize: (value: Pick<T, K>) => Buffer
	deserialize: (value: Buffer) => Pick<T, K>
}

/** Object that stores logic about splitting an object into several parts, and serializing/deserializing those parts */
export class ObjectPartitioner<T> {

	jsonSerializer: Serializer<T, any> = {
		serialize: x => Buffer.from(JSON.stringify(x, null, "\t"), "utf-8"),
		deserialize: x => JSON.parse(x.toString("utf-8"))
	}

	private restFile: [string, Serializer<T, any>] | null = null
	private knownFields: Map<keyof T, string> = new Map()
	private knownFiles: Map<string, Partition<T, keyof T>> = new Map()

	getFilenameWithField(field: keyof T): string {
		const filename = this.knownFields.get(field)
		if(filename !== undefined){
			return filename
		}
		if(this.restFile !== null){
			return this.restFile[0]
		}
		throw new Error(`Don't know which file is supposed to have field ${String(field)}`)
	}

	getSerializerForFile(file: string): Serializer<T, any> {
		if(this.restFile && this.restFile[0] === file){
			return this.restFile[1]
		}

		const knownFile = this.knownFiles.get(file)
		if(knownFile){
			return knownFile
		}

		throw new Error(`Don't know how to serialize file ${file}`)
	}

	addPartition<K extends keyof T>(filename: string, fieldOrSeveral: K | K[], serializer?: Serializer<T, K>): this {
		const fields = Array.isArray(fieldOrSeveral) ? fieldOrSeveral : [fieldOrSeveral]
		if(this.knownFiles.has(filename)){
			throw new Error(`Cannot add file ${filename} as partition file more than once.`)
		}
		for(const field of fields){
			const oldFieldFile = this.knownFields.get(field)
			if(oldFieldFile !== undefined){
				throw new Error(`Cannot add field ${String(field)} to partition of file ${filename}: it is already in partition of ${oldFieldFile}.`)
			}
			this.knownFields.set(field, filename)
		}
		this.knownFiles.set(filename, {fields, ...(serializer ?? this.jsonSerializer)})
		return this
	}

	addRestFile(filename: string, serializer?: Serializer<T, keyof T>): this {
		if(this.knownFiles.has(filename)){
			throw new Error(`File ${filename} cannot be both rest file and non-rest file`)
		}
		if(this.restFile !== null){
			throw new Error(`Cannot assign ${filename} as rest file: already have rest file, ${this.restFile}`)
		}
		this.restFile = [filename, serializer ?? this.jsonSerializer]
		return this
	}

	partition(value: T): [filename: string, data: Buffer][] {
		const result: [string, Buffer][] = []
		for(const [filename, partition] of this.knownFiles.entries()){
			const part = pick(value, partition.fields)
			result.push([filename, partition.serialize(part)])
		}

		if(this.restFile){
			const [filename, serializer] = this.restFile
			const part = omit(value, ...this.knownFields.keys())
			// part could have zero fields at this point, being just {}
			// we should write it regardless. we are assuming user knowing what he's doing
			// i.e. if there is a default partition - we should create a part for it
			result.push([filename, serializer.serialize(part)])
		}

		return result
	}

	async partitionAndWrite(directoryPath: string, value: T): Promise<void> {
		await Promise.all(this.partition(value).map(async([filename, data]) => {
			await Fs.writeFile(Path.resolve(directoryPath, filename), data)
		}))
	}

	async readAndAssemble(directoryPath: string): Promise<T> {
		const parts = await Promise.all([...this.knownFiles.entries()].map(async([filename, serializer]) => {
			const data = await Fs.readFile(Path.resolve(directoryPath, filename))
			return serializer.deserialize(data)
		}))

		return parts.reduce((a, b) => ({...a, ...b}), {} as Partial<T>) as T
	}

	async readField<K extends keyof T>(directoryPath: string, field: K): Promise<T[K]> {
		const fileName = this.getFilenameWithField(field)
		const serializer = this.getSerializerForFile(fileName)
		const data = await Fs.readFile(Path.resolve(directoryPath, fileName))
		const part = serializer.deserialize(data)
		return part[field]
	}

}
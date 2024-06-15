import {XY} from "@nartallax/e8"
import {UUID} from "common/uuid"

export interface SvgTextureFile {
	readonly width: number
	readonly height: number
	readonly svg: string
	readonly id: UUID
}


export function getAtlasSideLength(textures: readonly (SvgTextureFile & XY)[]): number {
	const width = textures.map(el => el.width + el.x).reduce((a, b) => Math.max(a, b), 0)
	const height = textures.map(el => el.height + el.y).reduce((a, b) => Math.max(a, b), 0)

	// atlas needs to be square and power-of-two
	let sideSize = Math.max(width, height)
	sideSize = 2 ** Math.ceil(Math.log2(sideSize))
	return sideSize
}
import {XY} from "@nartallax/e8"

export interface SvgTextureFile {
	width: number
	height: number
	svg: string
	path: string
}


export function getAtlasSideLength(textures: (SvgTextureFile & XY)[]): number {
	const width = textures.map(el => el.width + el.x).reduce((a, b) => Math.max(a, b), 0)
	const height = textures.map(el => el.height + el.y).reduce((a, b) => Math.max(a, b), 0)

	// atlas needs to be square and power-of-two
	let sideSize = Math.max(width, height)
	sideSize = 2 ** Math.ceil(Math.log2(sideSize))
	return sideSize
}
declare module "fernandez-polygon-decomposition" {
	type FernandezPolygon = {x: number, y: number}[]

	export function decompose(polygon: FernandezPolygon): FernandezPolygon[]
	export function isClockwiseOrdered(polygon: FernandezPolygon): boolean
	export function orderClockwise(polygon: FernandezPolygon): FernandezPolygon
	export function isSimple(polygon: FernandezPolygon): boolean
	export function isConvex(polygon: FernandezPolygon): boolean

	/** Robustness flag controls if robust real number algorithms should be used
	 * True means more precision, false means more speed */
	export function getRobustness(): boolean
	export function setRobustness(isRobust: boolean): void
}
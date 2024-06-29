import {UUID} from "crypto"
import {XY} from "@nartallax/e8"

/** Find index in the array at which point should be inserted
 * Here we are trying to guess what's the user intention was and where he wants the point to be inserted */
export function findPointInsertionIndex(points: [number, number][], point: XY): number {
	if(points.length < 2){
		return points.length
	}
	return findIndexByNearestLine(points, point)
}

function findIndexByNearestLine(points: [number, number][], point: XY): number {
	let minDistIndex = -1, minDist = Number.MAX_SAFE_INTEGER
	for(const [a, b, index] of lines(points)){
		const lineLength = Math.sqrt(((b[0] - a[0]) ** 2) + ((b[1] - a[1]) ** 2))
		const distToLine = distanceFromPointToLine(a, b, point, lineLength)
		const distToA = Math.sqrt(distance2Between(point, a))
		const distToB = Math.sqrt(distance2Between(point, b))
		const dist = distToA < lineLength && distToB < lineLength ? distToLine : Math.min(distToA, distToB)
		if(dist < minDist){
			minDistIndex = index
			minDist = dist
		}
	}
	return minDistIndex
}

void findIndexByTwoNearestPoints
function findIndexByTwoNearestPoints(points: [number, number][], point: XY): number {
	if(points.length < 2){
		return points.length
	}
	let nearestPointIndex = 0
	let nearestDist2 = distance2Between(point, points[0]!)
	for(let i = 1; i < points.length; i++){
		const p = points[i]!
		const dist2 = distance2Between(point, p)
		if(dist2 < nearestDist2){
			nearestDist2 = dist2
			nearestPointIndex = i
		}
	}
	const nextPoint = points[(nearestPointIndex + 1) % points.length]!
	const prevPoint = points[((nearestPointIndex - 1) + points.length) % points.length]!
	const insertIndex = distance2Between(point, nextPoint) < distance2Between(point, prevPoint)
		? nearestPointIndex + 1
		: nearestPointIndex
	return insertIndex
}

function distance2Between(a: XY, b: [number, number]): number {
	return ((a.x - b[0]) ** 2) + ((a.y - b[1]) ** 2)
}

export function distanceFromPointToLine(linePointA: [number, number], linePointB: [number, number], point: XY, lineLength?: number): number {
	const [x1, y1] = linePointA
	const [x2, y2] = linePointB
	lineLength ??= Math.sqrt(((x2 - x1) ** 2) + (y2 - y1) ** 2)
	if(lineLength === 0){
		return Math.sqrt(distance2Between(point, linePointA))
	}
	const {x: x0, y: y0} = point
	return Math.abs(((x2 - x1) * (y1 - y0)) - ((x1 - x0) * (y2 - y1))) / lineLength
}

function* lines(points: [number, number][]): IterableIterator<[[number, number], [number, number], number]> {
	let prevIndex = points.length - 1
	for(let i = 0; i < points.length; i++){
		yield[points[prevIndex]!, points[i]!, i]
		prevIndex = i
	}
}

// TODO: this doesn't really need inworld pixel size
export function shapeToSvgPathD(points: [number, number][], inworldUnitPixelSize: number, shapeId: UUID | null = null, currentlyDrawnShapeId: UUID | null = null): string {
	if(points.length === 0){
		return ""
	} else if(points.length === 1){
		const [x, y] = points[0]!
		const step = 1 / inworldUnitPixelSize
		return `M ${x} ${y} h ${step} v ${step} h ${step} z`
	} else {
		let result = points
			.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x} ${y}`)
			.join(" ")
		if(currentlyDrawnShapeId === null || currentlyDrawnShapeId !== shapeId){
			result += " z"
		}
		return result
	}
}
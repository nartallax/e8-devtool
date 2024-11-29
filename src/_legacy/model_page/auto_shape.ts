import {Growable2DBitmap} from "common/bitmap/growable_2d_bitmap"
import {XY} from "@nartallax/e8"
import {distanceFromPointToLine} from "_legacy/model_page/model_display/model_display_data"

// resolution multiplier.
// allows to counter some border-effects
// no reason to set higher than 3, won't work properly if set lower than 3
const resMult = 3

export async function buildObjectShapeByImage(imgUrl: string, widthUnits: number, heightUnits: number, unitPixelSize: number): Promise<XY[]> {
	const img = await loadImage(imgUrl)
	const widthPx = widthUnits * unitPixelSize / 2
	const heightPx = heightUnits * unitPixelSize / 2
	const bitmap = imgToBitmap(img, widthPx, heightPx)
	const upscaledBitmap = bitmap.upscale(resMult)
	let points = addPointsAtEdge(upscaledBitmap, widthPx * resMult, heightPx * resMult)
	points = scale(points, 1 / resMult)
	points = removeCollinearsByDistance(points, 0.1, 1, 1) // removing pixel sides
	points = removeCollinearsByDistance(points, 0.5, 2, 2) // smoothing individual pixels
	points = normalizePxCoords({
		coords: points, widthPx, heightPx, widthUnits, heightUnits
	})
	points = groupClosePoints(points, 0.025)
	points = removeCollinearsByDistance(points, 0.01, 1, 1)
	return points
}

async function loadImage(imgUrl: string): Promise<HTMLImageElement> {
	const img = new Image()
	img.src = imgUrl
	await new Promise<void>(ok => {
		if(img.complete){
			ok()
		} else {
			img.addEventListener("load", () => {
				ok()
			}, {once: true})
		}
	})
	return img
}

function imgToBitmap(img: HTMLImageElement, w: number, h: number): Growable2DBitmap {
	const bitmap = new Growable2DBitmap(w, h)

	// wonder if there's better way to get image data - straight from image, not involving canvas
	const canvas = document.createElement("canvas")
	canvas.width = w
	canvas.height = h
	// for debug
	// canvas.style.cssText = `width:${w * 3}px;height:${h * 3}px;border:1px solid red;box-sizing:content-box`
	// document.body.appendChild(canvas)
	const context = canvas.getContext("2d")
	if(!context){
		throw new Error("No 2d context for canvas")
	}
	context.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, 0, 0, w, h)
	const imgData = context.getImageData(0, 0, w, h)

	for(let y = 0; y < h; y++){
		const start = (y * w) << 2
		for(let x = 0; x < w; x++){
			const pixelStartIndex = start + (x << 2)
			const alpha = imgData.data[pixelStartIndex + 3]! // +3 because it's rgba bytes
			if(alpha >= 128){ // 0 - 255, but we don't want weird border rounding values
				bitmap.set(x, y)
			}
		}
	}

	return bitmap
}

const anyEdgeFindingGranularity = 10
function* numbersFromCenter(size: number, granularity = anyEdgeFindingGranularity): IterableIterator<number> {
	const maxIter = Math.floor(size / granularity)
	const center = Math.round(size / 2)
	let value = center
	for(let i = 0; i < maxIter; i++){
		value += (i & 1 ? -i : i) * granularity
		yield value
	}
}

function* linesFromCenter(width: number, height: number): IterableIterator<XY> {
	for(const x of numbersFromCenter(width)){
		for(let y = 0; y < height; y++){
			yield{x, y}
		}
	}
	for(const y of numbersFromCenter(height)){
		for(let x = 0; x < width; x++){
			yield{x, y}
		}
	}
}

function findAnyEdge(bitmap: Growable2DBitmap, width: number, height: number): XY | null {
	for(const xy of linesFromCenter(width, height)){
		if(isEdge(xy, bitmap)){
			return xy
		}
	}

	return null
}

function* surroundingCoords8(center: XY): IterableIterator<XY> {
	for(let x = -1; x <= 1; x++){
		for(let y = -1; y <= 1; y++){
			if(x !== 0 || y !== 0){
				yield{x: center.x + x, y: center.y + y}
			}
		}
	}
}

function* surroundingCoords4(center: XY): IterableIterator<XY> {
	yield{x: center.x, y: center.y - 1}
	yield{x: center.x, y: center.y + 1}
	yield{x: center.x - 1, y: center.y}
	yield{x: center.x + 1, y: center.y}
}


function isEdge(coords: XY, bitmap: Growable2DBitmap): boolean {
	if(bitmap.get(coords.x, coords.y)){
		return false
	}
	for(const {x, y} of surroundingCoords8(coords)){
		if(bitmap.get(x, y)){
			return true
		}
	}
	return false
}


function walkTheEdge(bitmap: Growable2DBitmap, start: XY, result: XY[]): void {

	let iterations = 0

	let curPoint = start
	let prevPoint = start
	outer: do {
		if(iterations++ > 1000000){
			// just so it doesn't loop indefinitely in case of some weird shit
			break
		}
		// result.push({x: curPoint.x, y: curPoint.y + 4})
		result.push(curPoint)
		for(const nextPoint of surroundingCoords4(curPoint)){
			if((nextPoint.x !== prevPoint.x || nextPoint.y !== prevPoint.y) && isEdge(nextPoint, bitmap)){
				prevPoint = curPoint
				curPoint = nextPoint
				continue outer
			}
		}
		break
	} while(curPoint.x !== start.x || curPoint.y !== start.y)
}

function addPointsAtEdge(bitmap: Growable2DBitmap, width: number, height: number): XY[] {
	const result: XY[] = []
	const start = findAnyEdge(bitmap, width, height)
	if(start){
		walkTheEdge(bitmap, start, result)
	}
	return result
}

function normalizePxCoords({
	coords, widthPx, heightPx, widthUnits, heightUnits
}: {coords: XY[], widthPx: number, heightPx: number, widthUnits: number, heightUnits: number}): XY[] {
	const dx = widthPx / 2
	const dy = heightPx / 2
	const multX = widthUnits / widthPx
	const multY = heightUnits / heightPx
	return coords.map(({x, y}) => ({x: (x - dx) * multX, y: (y - dy) * multY}))
}

function scale(coords: XY[], mult: number): XY[] {
	return coords.map(({x, y}) => ({x: x * mult, y: y * mult}))
}

function removeCollinearsByDistance(coords: XY[], maxDistance: number, decrement: number, increment: number): XY[] {
	if(coords.length < Math.max(decrement, increment) + 1){
		return coords
	}

	const result: XY[] = []
	for(let i = 0; i < coords.length; i++){
		const prevResult = result[result.length - decrement]
		const prevSrc = coords[(i - decrement + coords.length) % coords.length]!
		const prev = prevResult ?? prevSrc
		const next = coords[(i + increment) % coords.length]!
		const current = coords[i]!
		const dist = distanceFromPointToLine([prev.x, prev.y], [next.x, next.y], current)
		if(dist > maxDistance){
			result.push(current)
		}
	}
	return result
}


function findStartOfPotentialGroup(coords: XY[], maxDistance: number): number | null {
	if(coords.length < 3){
		return null
	}
	const maxDistance2 = maxDistance ** 2
	for(let i = 0; i < coords.length; i++){
		const prev = coords[(i - 1 + coords.length) % coords.length]!
		const curr = coords[i]!
		const dist2 = ((prev.x - curr.x) ** 2) + ((prev.y - curr.y) ** 2)
		if(dist2 > maxDistance2){
			return i
		}
	}
	return null
}

function* fromIndexToIndexWrapped(start: number, end: number, length: number): IterableIterator<number> {
	start = (start + length) % length
	end = (end + length) % length
	for(let i = 0; i < length; i++){
		const item = (i + start) % length
		if(item === end){
			return
		}
		yield item
	}
}

function groupClosePoints(coords: XY[], maxDistance: number): XY[] {
	const startingIndex = findStartOfPotentialGroup(coords, maxDistance)
	if(startingIndex === null){
		return coords
	}

	const result: XY[] = []
	function saveGroup(from: number, to: number): void {
		let x = 0, y = 0, count = 0
		for(const k of fromIndexToIndexWrapped(from, to, coords.length)){
			const point = coords[k]!
			x += point.x
			y += point.y
			count++
		}
		result.push({x: x / count, y: y / count})
	}

	let groupStart = startingIndex
	let groupDistance = 0
	for(const i of fromIndexToIndexWrapped(startingIndex, startingIndex - 1, coords.length)){
		const curr = coords[i]!
		const next = coords[(i + 1) % coords.length]!
		groupDistance += Math.sqrt(((curr.x - next.x) ** 2) + ((curr.y - next.y) ** 2))
		if(groupDistance > maxDistance){
			saveGroup(groupStart, i + 1)
			groupDistance = 0
			groupStart = (i + 1) % coords.length
		}
	}

	saveGroup(groupStart, startingIndex)
	return result
}

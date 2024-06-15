import * as XmlJs from "xml-js"

const floatAccuracy = 4

export function optimizeSvg(srcSvgText: string, path: string): {svg: string, width: number, height: number} {
	const dom = XmlJs.xml2js(srcSvgText, {compact: false}) as XmlJs.Element
	stripNode(dom)
	const svgAttrs = getSvgFromDom(dom).attributes ?? {}
	const width = parseFloat(svgAttrs["width"] + "")
	const height = parseFloat(svgAttrs["height"] + "")
	if(Number.isNaN(width) || Number.isNaN(height)){
		throw new Error(`SVG at ${path} has weird width/height: ${svgAttrs["width"]}/${svgAttrs["height"]}`)
	}
	return {svg: XmlJs.js2xml(dom), width, height}
}

export function setSvgPosition(srcSvgText: string, xy: {x: number, y: number}): string {
	// wonder if this parsing will affect performance
	// it's probably faster to just run two regexps, but for how much?
	const dom = XmlJs.xml2js(srcSvgText, {compact: false}) as XmlJs.Element
	const svg = getSvgFromDom(dom)

	const attrs = svg.attributes || {}
	attrs["x"] = tryFixFloatForSvg(xy.x)
	attrs["y"] = tryFixFloatForSvg(xy.y)
	svg.attributes = attrs
	return XmlJs.js2xml(dom)
}

function getSvgFromDom(dom: XmlJs.Element): XmlJs.Element {
	const svg = dom.elements?.[0]
	if(!svg || svg.name !== "svg"){
		throw new Error("First DOM element is not <svg>, wtf")
	}
	return svg
}

const numericAttrs: string[] = [
	"height", "width", "x", "y", "r", "rx", "ry", "cx", "cy"
]

function stripNode(node: XmlJs.Element): void {
	if(node.attributes){
		const resultAttrs = {} as Record<string, string | number | undefined>
		for(const attrName in node.attributes){
			if(attrName.indexOf(":") > 0 || attrName === "id"){
				continue
			}

			resultAttrs[attrName] = node.attributes[attrName]
		}
		node.attributes = resultAttrs
	}

	if(node.type === "element" && node.attributes){
		if(node.name === "path" && node.attributes["d"]){
			node.attributes["d"] = optimizePath(node.attributes["d"] + "")
		}
		for(const attrName of numericAttrs){
			if(attrName in node.attributes){
				node.attributes[attrName] = tryFixFloatForSvg(node.attributes[attrName])
			}
		}
	}

	if(node.elements){
		const resultChildNodes = [] as XmlJs.Element[]

		for(let child of node.elements){
			if(child.type === "comment"){
				continue
			}

			if(child.type === "element" && child.name){
				if(child.name.indexOf(":") > 0){
					continue
				}

				if(child.name === "defs"){
					if(child.elements && child.elements.length > 0){
						console.warn("Non-empty <defs>, that's unusual. Maybe ID stripping will lead to errors: " + XmlJs.js2xml(child))
					} else {
						continue
					}
				}

				if(child.name === "g"){
					if(child.elements && child.elements.length === 1){
						child = child.elements[0]!
					}
				}
			}

			stripNode(child)
			resultChildNodes.push(child)
		}

		node.elements = resultChildNodes
	}
}

export function toFixedWithoutTrailingZeroes(x: number, positions: number): string {
	let res = x.toFixed(positions)
	if(res.indexOf(".") > 0){
		res = res.replace(/\.?0+$/, "")
	}
	if(res === "-0"){
		res = "0"
	}
	return res
}

function tryFixFloatForSvg(str: string | number | undefined): string | number | undefined {
	if(typeof(str) !== "string"){
		return str
	}
	const num = parseFloat(str)
	if(Number.isNaN(num)){
		return str
	} else {
		return toFixedWithoutTrailingZeroes(num, floatAccuracy)
	}
}

function optimizePath(path: string): string {
	return path.split(/[, ]+/).map(part => tryFixFloatForSvg(part)).join(" ")
}
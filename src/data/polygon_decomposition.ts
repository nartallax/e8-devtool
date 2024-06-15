import * as FernandezDecomp from "fernandez-polygon-decomposition"

export function decomposeShapes(shapes: [x: number, y: number][][]): [x: number, y: number][][] {

	// it should be true by default, but just in case
	FernandezDecomp.setRobustness(true)

	const result: [number, number][][] = []
	for(const shape of shapes){
		if(shape.length < 3){
			continue
		}
		let polygon = shape.map(([x, y]) => ({x, y}))
		if(!FernandezDecomp.isSimple(polygon)){
			throw new Error("Cannot decompose shapes: some of them are non-simple.")
		}

		if(!FernandezDecomp.isClockwiseOrdered(polygon)){
			polygon = FernandezDecomp.orderClockwise(polygon)
		}

		const decomped = FernandezDecomp.decompose(polygon)
		if(polygon.length > decomped.flat().length){
			// this check is here just in case
			// there was a bug in other library we used that was dropping some points
			// it didn't reproduce in this one, but let's just be safe
			throw new Error("Decomp failed")
		}
		for(const decompedPoly of decomped){
			result.push(decompedPoly.map(x => [x.x, x.y]))
		}
	}
	return result
}
import {getSortedProjectBinds, mappedForestToArray} from "data/project_utils"
import {optimizeSvg, setSvgPosition} from "data/optimize_svg"
import {decomposeShapes} from "data/polygon_decomposition"
import {SvgTextureFile, getAtlasSideLength} from "data/project_to_resourcepack/atlas_building_utils"
import {buildAtlasLayout} from "data/project_to_resourcepack/build_atlas_layout"
import {AltasPartWithLayer, Atlas, InputBindDefinition, Model, ResourcePack, XY} from "@nartallax/e8"
import {promises as Fs} from "fs"
import * as Path from "path"
import {UUID} from "common/uuid"
import {omit} from "common/omit"
import {Tree} from "common/tree"
import {DevtoolActions} from "server/actions"
import {nonNull} from "common/non_null"

/** Convert project into ResourcePack structure. */
export async function projectToResourcePack(actions: DevtoolActions): Promise<ResourcePack> {
	const allModels = (await actions.dirs.models.getAllItemsAsArray()).sort((a, b) => a.id > b.id ? 1 : -1)
	const texturesWithPositions = await projectToAtlasLayout(actions)
	const atlasSideLength = getAtlasSideLength(texturesWithPositions)
	const atlasSvg = glueSvgsIntoAtlas(texturesWithPositions, atlasSideLength)
	const atlas: Atlas = {
		size: [atlasSideLength, atlasSideLength],
		pictures: [{extension: "svg", data: atlasSvg}]
	}

	const textureByPath = new Map(texturesWithPositions.map(texture => [texture.path, texture]))
	const getAtlasPart = (layerId: UUID, path: string): AltasPartWithLayer => {
		const texture = textureByPath.get(path)!
		return {
			atlasIndex: 0, // only one atlas so far, so whatever
			layer: layers(layerId),
			position: [texture.x / atlas.size[0], texture.y / atlas.size[1]],
			size: [texture.width / atlas.size[0], texture.height / atlas.size[1]]
		}
	}

	const [collisionGroupPairIds, inputBindForest, inputBindMap, config, layersForest, layersMap, collisionGroupsForest, collisionGroupsMap, inputGroupsForest, inputGroupsMap, particlesForest, particlesMap] = await Promise.all([
		actions.getCollisionPairs(),
		actions.dirs.inputBinds.getForest(),
		actions.dirs.inputBinds.getAllItemsAsMap(),
		actions.getProjectConfig(),
		actions.dirs.layers.getForest(),
		actions.dirs.layers.getAllItemsAsMap(),
		actions.dirs.collsionGroups.getForest(),
		actions.dirs.collsionGroups.getAllItemsAsMap(),
		actions.dirs.inputGroups.getForest(),
		actions.dirs.inputGroups.getAllItemsAsMap(),
		actions.dirs.particles.getForest(),
		actions.dirs.particles.getAllItemsAsMap()
	])

	const layers = mappedForestToIndexMap("layer", layersForest, layersMap)
	const collisionGroups = mappedForestToIndexMap("collision group", collisionGroupsForest, collisionGroupsMap)
	const inputGroups = mappedForestToIndexMap("input group", inputGroupsForest, inputGroupsMap)

	const models = allModels.map((model): Model => {
		return {
			size: [model.size.x, model.size.y],
			texture: !model.texturePath ? null : getAtlasPart(model.layerId, model.texturePath),
			physics: {
				collisionGroup: collisionGroups(model.collisionGroupId),
				isStatic: model.isStatic,
				shapes: decomposeShapes(model.shapes.map(shape => shape.points))
			}
		}
	})

	const collisionGroupPairs = collisionGroupPairIds.map(([a, b]) => [collisionGroups(a), collisionGroups(b)] as const)

	const inputBinds: InputBindDefinition[] = getSortedProjectBinds(inputBindForest, inputBindMap).map(([bind]) => ({
		group: bind.groupId === null ? null : inputGroups(bind.groupId),
		isHold: bind.isHold,
		defaultChords: bind.defaultChords
			.map(chord => chord.chord)
			.filter(chord => chord.length > 0)
	}))

	return {
		inworldUnitPixelSize: config.inworldUnitPixelSize,
		particles: mappedForestToArray(particlesForest, particlesMap).map(def => ({
			...omit(def, "emissionType", "layerId"),
			texture: getAtlasPart(def.layerId, def.texturePath)
		})),
		// TODO: build atlasses in runtime, for modability sake
		// also this will allow us to use runtime constraints at machine we're building atlasses for
		atlasses: [atlas],
		models,
		inputBinds,
		layers: mappedForestToArray(layersForest, layersMap).map(layer => ({type: layer.type})),
		// TODO: this is bad for modability
		collisionGroupCount: Object.values(collisionGroupsMap).length,
		collisionGroupPairs: collisionGroupPairs
	}
}

export async function projectToAtlasLayout(actions: DevtoolActions): Promise<(SvgTextureFile & XY)[]> {
	const [modelTexturePaths, particleTexturePath] = await Promise.all([
		actions.dirs.models.getFieldOfAllItemsAsArray("texturePath"),
		actions.dirs.particles.getFieldOfAllItemsAsArray("texturePath")
	])
	let allTexturePaths = [...modelTexturePaths, ...particleTexturePath].filter(nonNull)
	allTexturePaths = [...new Set(allTexturePaths)]
	const allTextures = await readAllTextures(allTexturePaths, actions)
	// wonder how slow will be to have cellSize = 1 here
	// maybe I'll need to optimize that
	return buildAtlasLayout(allTextures, 1)
}

// TODO: index maps in general are bad for modability
const mappedForestToIndexMap = (name: string, forest: Tree<string, string>[], mapObj: Record<string, {id: UUID}>): (id: UUID) => number => {
	const map = new Map<UUID, number>(mappedForestToArray(forest, mapObj).map(({id}, index) => [id, index]))
	return id => {
		const index = map.get(id)
		if(index === undefined){
			throw new Error(`There's no ${name} with id = ${id}, but something is referencing it.`)
		}
		return index
	}
}

function glueSvgsIntoAtlas(textures: (SvgTextureFile & XY)[], sideLength: number): string {
	const compoundSvg = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${sideLength} ${sideLength}" width="${sideLength}" height="${sideLength}">
	${textures
		.map(texture => setSvgPosition(texture.svg, texture)
			.replace(/<\?xml.*?\?>/, ""))
		.join("\n")}
</svg>`

	return compoundSvg
}

async function readAllTextures(paths: string[], actions: DevtoolActions): Promise<SvgTextureFile[]> {
	const result = new Array<SvgTextureFile>(paths.length)
	await Promise.all(paths.map(async(path, index) => {
		if(!path.toLowerCase().endsWith(".svg")){
			throw new Error("Only svgs are supported; got " + path)
		}
		const config = await actions.getProjectConfig()
		const texturesRoot = actions.resolveProjectPath(config.textureDirectoryPath)
		const fileContent = await Fs.readFile(Path.resolve(texturesRoot, path), "utf-8")
		result[index] = {...optimizeSvg(fileContent, path), path}
	}))
	return result
}
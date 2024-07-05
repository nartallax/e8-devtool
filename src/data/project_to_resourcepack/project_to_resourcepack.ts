import {Project, NamedId} from "data/project"
import {getAllProjectModels, getSortedProjectBinds, mappedForestToArray} from "data/project_utils"
import {optimizeSvg, setSvgPosition} from "data/optimize_svg"
import {decomposeShapes} from "data/polygon_decomposition"
import {SvgTextureFile, getAtlasSideLength} from "data/project_to_resourcepack/atlas_building_utils"
import {buildAtlasLayout} from "data/project_to_resourcepack/build_atlas_layout"
import {Atlas, InputBindSetDefinition, Model, ResourcePack, XY} from "@nartallax/e8"
import {promises as Fs} from "fs"
import * as Path from "path"
import {UUID} from "crypto"
import {omit} from "common/omit"
import {Tree, getForestLeavesAsArray} from "common/tree"
import {DevtoolActions} from "server/actions"

/** Convert project into ResourcePack structure. */
export async function projectToResourcePack(project: Project, actions: DevtoolActions): Promise<ResourcePack> {
	const allModels = getAllProjectModels(project)
	const texturesWithPositions = await projectToAtlasLayout(project, actions)
	const atlasSideLength = getAtlasSideLength(texturesWithPositions)
	const atlasSvg = glueSvgsIntoAtlas(texturesWithPositions, atlasSideLength)
	const atlas: Atlas = {
		size: [atlasSideLength, atlasSideLength],
		pictures: [{extension: "svg", data: atlasSvg}]
	}

	const textureByPath = new Map(texturesWithPositions.map(texture => [texture.id, texture]))
	const layers = mappedForestToIndexMap("layer", project.layerTree, project.layers)
	const collisionGroups = mappedForestToIndexMap("collision group", project.collisionGroupTree, project.collisionGroups)
	const inputGroups = namedIdsToIndexMap("input group", project.inputGroups)
	const models = allModels.map((model): Model => {
		const texture = textureByPath.get(model.textureId)!
		return {
			size: [model.size.x, model.size.y],
			texture: {
				atlasIndex: 0, // only one atlas so far, so whatever
				layer: layers(model.layerId),
				position: [texture.x / atlas.size[0], texture.y / atlas.size[1]],
				size: [texture.width / atlas.size[0], texture.height / atlas.size[1]]
			},
			physics: {
				collisionGroup: collisionGroups(model.collisionGroupId),
				isStatic: model.isStatic,
				shapes: decomposeShapes(model.shapes.map(shape => shape.points))
			}
		}
	})

	const collisionGroupPairs = project.collisionGroupPairs.map(([a, b]) => [collisionGroups(a), collisionGroups(b)] as const)

	const inputBinds: InputBindSetDefinition[] = getSortedProjectBinds(project).map(bindSet => ({
		binds: bindSet.binds.map(bind => ({
			group: bind.group === null ? null : inputGroups(bind.group),
			isHold: bind.isHold,
			defaultChords: bind.defaultChords
				.map(chord => chord.chord)
				.filter(chord => chord.length > 0)
		}))
	}))

	return {
		inworldUnitPixelSize: project.config.inworldUnitPixelSize,
		particles: mappedForestToArray(project.particleTree, project.particles).map(def => omit(def, "emissionType")),
		atlasses: [atlas],
		models,
		inputBinds,
		layers: mappedForestToArray(project.layerTree, project.layers).map(layer => ({type: layer.type})),
		// TODO: this is bad for modability
		collisionGroupCount: Object.values(project.collisionGroups).length,
		collisionGroupPairs: collisionGroupPairs
	}
}

export async function projectToAtlasLayout(project: Project, actions: DevtoolActions): Promise<(SvgTextureFile & XY)[]> {
	const allModels = getAllProjectModels(project)
	const allTextureIds = [...new Set(allModels.map(model => model.textureId))]
	const allTextures = await readAllTextures(allTextureIds, project, actions)
	// wonder how slow will be to have cellSize = 1 here
	// maybe I'll need to optimize that
	return buildAtlasLayout(allTextures, 1)
}

function namedIdsToIndexMap(name: string, ids: NamedId[]): (id: UUID) => number {
	const map = new Map<UUID, number>(ids.map(({id}, index) => [id, index]))
	return id => {
		const index = map.get(id)
		if(index === undefined){
			throw new Error(`There's no ${name} with id = ${id}, but something is referencing it.`)
		}
		return index
	}
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

async function readAllTextures(ids: UUID[], project: Project, actions: DevtoolActions): Promise<SvgTextureFile[]> {
	const result = new Array<SvgTextureFile>(ids.length)
	const textureTree = await actions.getTextureTree()
	const textureFiles = getForestLeavesAsArray(textureTree)
	const textureMap = new Map(textureFiles.map(file => [file.id, file.fullPath]))
	await Promise.all(ids.map(async(id, index) => {
		const path = textureMap.get(id)
		if(!path){
			throw new Error("Failed to resolve texture by ID: unknown UUID: " + id)
		}
		if(!path.toLowerCase().endsWith(".svg")){
			throw new Error("Only svgs are supported; got " + id)
		}
		const texturesRoot = actions.resolveProjectPath(project.config.textureDirectoryPath)
		const fileContent = await Fs.readFile(Path.resolve(texturesRoot, path), "utf-8")
		result[index] = {...optimizeSvg(fileContent, id), id}
	}))
	return result
}
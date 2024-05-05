import {Project, NamedId} from "data/project"
import {getAllProjectModels, getSortedProjectBinds} from "data/project_utils"
import {optimizeSvg, setSvgPosition} from "data/optimize_svg"
import {decomposeShapes} from "data/polygon_decomposition"
import {SvgTextureFile, getAtlasSideLength} from "data/project_to_resourcepack/atlas_building_utils"
import {buildAtlasLayout} from "data/project_to_resourcepack/build_atlas_layout"
import {Config} from "server/config"
import {Atlas, InputBindSetDefinition, Model, ResourcePack} from "@nartallax/e8"
import {promises as Fs} from "fs"
import * as Path from "path"
import {XY} from "@nartallax/e8"
import {UUID} from "crypto"
import {omit} from "common/omit"

/** Convert project into ResourcePack structure. */
export async function projectToResourcePack(project: Project, config: Config): Promise<ResourcePack> {
	const allModels = getAllProjectModels(project)
	const texturesWithPositions = await projectToAtlasLayout(project, config)
	const atlasSideLength = getAtlasSideLength(texturesWithPositions)
	const atlasSvg = glueSvgsIntoAtlas(texturesWithPositions, atlasSideLength)
	const atlas: Atlas = {
		size: [atlasSideLength, atlasSideLength],
		pictures: [{extension: "svg", data: atlasSvg}]
	}

	const textureByPath = new Map(texturesWithPositions.map(texture => [texture.path, texture]))
	const layers = namedIdsToIndexMap("layer", project.layers)
	const collisionGroups = namedIdsToIndexMap("collision group", project.collisionGroups)
	const inputGroups = namedIdsToIndexMap("input group", project.inputGroups)
	const models = allModels.map((model): Model => {
		const texture = textureByPath.get(model.texturePath)!
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
			defaultChords: bind.defaultChords.filter(chord => chord.length > 0)
		}))
	}))

	return {
		inworldUnitPixelSize: config.inworldUnitPixelSize,
		particles: project.particles.map(def => omit(def, "emissionType")),
		atlasses: [atlas],
		models,
		inputBinds,
		layers: project.layers.map(layer => ({type: layer.type})),
		collisionGroupCount: project.collisionGroups.length,
		collisionGroupPairs: collisionGroupPairs
	}
}

export async function projectToAtlasLayout(project: Project, config: Config): Promise<(SvgTextureFile & XY)[]> {
	const allModels = getAllProjectModels(project)
	const allTexturePaths = [...new Set(allModels.map(model => model.texturePath))]
	const allTextures = await readAllTextures(
		allTexturePaths,
		path => Path.resolve(config.textureDirectoryPath, path)
	)
	// wonder how slow will be to have cellSize = 1 here
	// maybe I'll need to optimize that
	return buildAtlasLayout(allTextures, 1)
}

function namedIdsToIndexMap(name: string, ids: readonly NamedId[]): (id: UUID) => number {
	const map = new Map<UUID, number>(ids.map(({id}, index) => [id, index]))
	return id => {
		const index = map.get(id)
		if(index === undefined){
			throw new Error(`There's no ${name} with id = ${id}, but something is referencing it.`)
		}
		return index
	}
}

function glueSvgsIntoAtlas(textures: readonly (SvgTextureFile & XY)[], sideLength: number): string {
	const compoundSvg = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${sideLength} ${sideLength}" width="${sideLength}" height="${sideLength}">
	${textures
		.map(texture => setSvgPosition(texture.svg, texture)
			.replace(/<\?xml.*?\?>/, ""))
		.join("\n")}
</svg>`

	return compoundSvg
}

async function readAllTextures(paths: readonly string[], resolvePath: (path: string) => string): Promise<SvgTextureFile[]> {
	const result = new Array<SvgTextureFile>(paths.length)
	await Promise.all(paths.map(async(path, index) => {
		if(!path.toLowerCase().endsWith(".svg")){
			throw new Error("Only svgs are supported; got " + path)
		}
		const fileContent = await Fs.readFile(resolvePath(path), "utf-8")
		result[index] = {...optimizeSvg(fileContent, path), path}
	}))
	return result
}
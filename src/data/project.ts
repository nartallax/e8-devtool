import {Tree} from "common/tree"
import {UUID} from "crypto"
import {XY, Chord, LayerType, ParticleDefinition} from "@nartallax/e8"
import {getRandomUUID} from "common/uuid"

/** Project is source data for resource pack
 *
 * this data structure only relevant to project manager,
 * and is not used anywhere in the actual engine runtime  */
export interface Project {
	config: ProjectConfig

	models: Record<string, ProjectModel>
	modelTree: Tree<string, string>[]

	particles: Record<string, ProjectParticleDefinition>
	particleTree: Tree<string, string>[]

	collisionGroups: Record<string, ProjectCollisionGroup>
	collisionGroupTree: Tree<string, string>[]
	collisionGroupPairs: [UUID, UUID][]

	/** Couples of groups that should be colliding. */
	layers: Record<string, ProjectLayerDefinition>
	layerTree: Tree<string, string>[]

	inputGroups: Record<string, ProjectInputGroup>
	inputGroupTree: Tree<string, string>[]
	inputBinds: Record<string, ProjectInputBind>
	inputBindTree: Tree<string, string>[]
}

export type ProjectConfig = {
	/** Resolution of one inworld unit (on x1 zoom)
	Used to determine how to render vector textures, if there are any, and some other values related to resolution. */
	inworldUnitPixelSize: number
	resourcePackPath: string
	textureDirectoryPath: string
	/** Path that contains classes related to entities */
	entityClassesDirectoryPath: string
	ts: {
		entityEnumName: string
		inputBindsEnumName: string
		loaderVariableName: string
		particleEnumName: string
		path: string
	}
}

export type ProjectInputGroup = {
	id: UUID
}

export type ProjectCollisionGroup = {
	id: UUID
}

export interface ProjectParticleDefinition extends ParticleDefinition {
	id: UUID
	/** This only matters to devtool and calculation of `.amount`
	 * in runtime emission type is determined by usage */
	emissionType: "once" | "continuous"
}

export interface ProjectLayerDefinition {
	id: UUID
	type: LayerType
}

export interface ProjectInputBind {
	id: UUID
	group: UUID | null
	isHold: boolean
	defaultChords: ProjectChord[]
}

export type ProjectChord = {
	id: UUID
	chord: Chord
}

export function makeBlankProject(): Project {
	const collisionGroup: ProjectCollisionGroup = {id: getRandomUUID()}
	const modelLayer: ProjectLayerDefinition = {id: getRandomUUID(), type: "model"}
	const particleLayer: ProjectLayerDefinition = {id: getRandomUUID(), type: "particle"}
	return {
		config: {
			inworldUnitPixelSize: 100,
			resourcePackPath: "./generated/resource_pack.e8.bin",
			textureDirectoryPath: "./textures",
			entityClassesDirectoryPath: "./entities",
			ts: {
				path: "./generated/resource_pack_content.e8.ts",
				inputBindsEnumName: "Bind",
				loaderVariableName: "loader",
				entityEnumName: "Entities",
				particleEnumName: "Particles"
			}
		},
		collisionGroups: {default: collisionGroup},
		collisionGroupTree: [{value: "default"}],
		collisionGroupPairs: [[collisionGroup.id, collisionGroup.id]],
		layers: {model: modelLayer, particle: particleLayer},
		layerTree: [{value: "model"}, {value: "particle"}],
		models: {},
		particles: {},
		particleTree: [],
		modelTree: [],
		inputBindTree: [{value: "default bind"}],
		inputBinds: {
			"default bind": {
				id: getRandomUUID(),
				group: null,
				isHold: false,
				defaultChords: [{
					id: getRandomUUID(),
					chord: ["Ctrl", "W"]
				}]
			}
		},
		inputGroups: {"default input group": {id: getRandomUUID()}},
		inputGroupTree: [{value: "default input group"}]
	}
}

type BlankModelParams = {
	collisionGroupId: UUID
	layerId: UUID
	texturePath: string
}

export const makeBlankModel = ({collisionGroupId, layerId, texturePath}: BlankModelParams): ProjectModel => ({
	id: getRandomUUID(),
	layerId,
	collisionGroupId,
	size: {x: 1, y: 1},
	texturePath,
	isStatic: false,
	shapes: []
})

export interface ProjectModel {
	id: UUID
	isStatic: boolean
	shapes: ProjectShape[]
	collisionGroupId: UUID
	layerId: UUID
	// TODO: make nullable
	texturePath: string
	size: XY
}

export interface ProjectShape {
	id: UUID
	points: [x: number, y: number][]
}
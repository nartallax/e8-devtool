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
	// TODO: think about reorganizing this array to map-object
	// and other arrays, why not
	// maybe then abolish NamedId alltogeter
	// map full path -> model
	models: Record<string, ProjectModel>
	particles: ProjectParticleDefinition[]
	modelTree: Tree<string, string>[]
	// TODO: create a tree for everything. layers, groups etc.
	// store names in tree only
	// this will allow for more uniform editing experience
	collisionGroups: ProjectCollisionGroup[]
	inputGroups: ProjectInputGroup[]
	/** Couples of groups that should be colliding. */
	collisionGroupPairs: [UUID, UUID][]
	layers: ProjectLayerDefinition[]
	// TODO: redo input binds. make bind group optional/multiple; it'll act as selector
	// this will also make binds more tree-like, which is good
	inputBinds: ProjectInputBindSet[]
}

type ProjectConfig = {
	/** Resolution of one inworld unit (on x1 zoom)
	Used to determine how to render vector textures, if there are any, and some other values related to resolution. */
	inworldUnitPixelSize: number
	resourcePackPath: string
	textureDirectoryPath: string
	/** Path that contains classes related to entities */
	entityClassesDirectoryPath: string
	ts: {
		entityEnumName: string
		inputBindSetEnumName: string
		inputBindsNamespaceName: string
		loaderVariableName: string
		particleEnumName: string
		path: string
	}
}

export type ProjectInputGroup = NamedId
export type ProjectCollisionGroup = NamedId

export interface ProjectParticleDefinition extends ParticleDefinition, NamedId {
	/** This only matters to devtool and calculation of `.amount`
	 * in runtime emission type is determined by usage */
	emissionType: "once" | "continuous"
}

export interface ProjectLayerDefinition extends NamedId {
	type: LayerType
}

export interface ProjectInputBindSet extends NamedId {
	binds: ProjectInputBind[]
}

export interface ProjectInputBind extends NamedId {
	group: UUID | null
	isHold: boolean
	defaultChords: ProjectChord[]
}

export type ProjectChord = {
	id: UUID
	chord: Chord
}

export function makeBlankProject(): Project {
	const collisionGroup: ProjectCollisionGroup = {id: getRandomUUID(), name: "default"}
	const modelLayer: ProjectLayerDefinition = {id: getRandomUUID(), name: "model", type: "model"}
	const particleLayer: ProjectLayerDefinition = {id: getRandomUUID(), name: "model", type: "model"}
	return {
		config: {
			inworldUnitPixelSize: 100,
			// TODO: path resolving and how to approach that
			resourcePackPath: "./generated/resource_pack.e8.bin",
			textureDirectoryPath: "./textures",
			entityClassesDirectoryPath: "./entities",
			ts: {
				path: "./generated/resource_pack_content.e8.ts",
				inputBindSetEnumName: "BindSet",
				inputBindsNamespaceName: "BindSets",
				loaderVariableName: "loader",
				entityEnumName: "Entities",
				particleEnumName: "Particles"
			}
		},
		collisionGroups: [collisionGroup],
		collisionGroupPairs: [[collisionGroup.id, collisionGroup.id]],
		layers: [modelLayer, particleLayer],
		models: {},
		particles: [],
		modelTree: [],
		inputBinds: [{
			id: getRandomUUID(),
			name: "default bind set",
			binds: [{
				id: getRandomUUID(),
				group: null,
				isHold: false,
				name: "default bind",
				defaultChords: [{
					id: getRandomUUID(),
					chord: ["Ctrl", "W"]
				}]
			}]
		}],
		inputGroups: [{id: getRandomUUID(), name: "default input group"}]
	}
}

type BlankModelParams = {
	collisionGroupId: UUID
	layerId: UUID
	textureId: UUID
}

export const makeBlankModel = ({collisionGroupId, layerId, textureId}: BlankModelParams): ProjectModel => ({
	id: getRandomUUID(),
	layerId,
	collisionGroupId,
	size: {x: 1, y: 1},
	textureId,
	isStatic: false,
	shapes: []
})

export interface NamedId {
	name: string
	id: UUID
}

export interface ProjectModel {
	id: UUID
	isStatic: boolean
	shapes: ProjectShape[]
	collisionGroupId: UUID
	layerId: UUID
	textureId: UUID
	size: XY
}

export interface ProjectShape {
	id: UUID
	points: [x: number, y: number][]
}

// name is filename, like the last portion of the file path
export interface TextureFile extends NamedId {
	fullPath: string
}
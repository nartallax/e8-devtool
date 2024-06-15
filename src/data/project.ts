import {Tree} from "common/tree"
import {getRandomUUID, zeroUUID} from "common/uuid"
import {UUID} from "crypto"
import {XY, Chord, LayerType, ParticleDefinition} from "@nartallax/e8"

/** Project is source data for resource pack
 *
 * this data structure only relevant to project manager,
 * and is not used anywhere in the actual engine runtime  */
export interface Project {
	// TODO: think about reorganizing this array to map-object
	// and other arrays, why not
	// maybe then abolish NamedId alltogeter
	models: ProjectModel[]
	particles: ProjectParticleDefinition[]
	modelTree: Tree<UUID, NamedId>[]
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
	return {
		collisionGroups: [],
		collisionGroupPairs: [],
		layers: [],
		models: [],
		particles: [],
		modelTree: [],
		inputBinds: [],
		inputGroups: []
	}
}

export interface NamedId {
	name: string
	id: UUID
}

export interface ProjectModel extends NamedId {
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

export function makeBlankProjectModel(layerId: UUID, collisionGroupId: UUID): ProjectModel {
	return {
		id: getRandomUUID(),
		layerId,
		collisionGroupId,
		name: "unnamed model",
		size: {x: 1, y: 1},
		textureId: zeroUUID,
		isStatic: false,
		shapes: []
	}
}

// name is filename, like the last portion of the file path
export interface TextureFile extends NamedId {
	fullPath: string
}
import {Tree} from "common/tree"
import {getRandomUUID, zeroUUID} from "common/uuid"
import {UUID} from "crypto"
import {XY, Chord, LayerType, ParticleDefinition} from "@nartallax/e8"

/** Project is source data for resource pack
 *
 * this data structure only relevant to project manager,
 * and is not used anywhere in the actual engine runtime  */
export interface Project {
	readonly models: readonly ProjectModel[]
	readonly particles: readonly ProjectParticleDefinition[]
	readonly modelTree: readonly Tree<UUID, NamedId>[]
	// TODO: create a tree for everything. layers, groups etc.
	// store names in tree only
	// this will allow for more uniform editing experience
	// TODO: i'm starting to have second thoughts about readonly-ing everything
	// sure, they are readonly, but it goes without saying
	// and readonly-ing everything just introduces a lot of clutter
	readonly collisionGroups: readonly ProjectCollisionGroup[]
	readonly inputGroups: readonly ProjectInputGroup[]
	/** Couples of groups that should be colliding. */
	readonly collisionGroupPairs: readonly (readonly [UUID, UUID])[]
	readonly layers: readonly ProjectLayerDefinition[]
	readonly inputBinds: readonly ProjectInputBindSet[]
}

export type ProjectInputGroup = NamedId
export type ProjectCollisionGroup = NamedId

export interface ProjectParticleDefinition extends ParticleDefinition, NamedId {
	/** This only matters to devtool and calculation of `.amount`
	 * in runtime emission type is determined by usage */
	emissionType: "once" | "continuous"
}

export interface ProjectLayerDefinition extends NamedId {
	readonly type: LayerType
}

export interface ProjectInputBindSet extends NamedId {
	readonly binds: ProjectInputBind[]
}

export interface ProjectInputBind extends NamedId {
	readonly group: UUID | null
	readonly isHold: boolean
	readonly defaultChords: readonly ProjectChord[]
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
	readonly name: string
	readonly id: UUID
}

export interface ProjectModel extends NamedId {
	readonly isStatic: boolean
	readonly shapes: ProjectShape[]
	readonly collisionGroupId: UUID
	readonly layerId: UUID
	readonly textureId: UUID
	readonly size: XY
}

export interface ProjectShape {
	readonly id: UUID
	readonly points: readonly (readonly [x: number, y: number])[]
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
	readonly fullPath: string
}
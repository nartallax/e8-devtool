import {Tree} from "common/tree"
import {getRandomUUID} from "common/uuid"
import {UUID} from "crypto"
import {XY, Chord, LayerType, ParticleDefinition} from "@nartallax/e8"

/** Project is source data for resource pack
 *
 * "project manager project" is a bit redundant of a name, true,
 * but I want to outline that this data structure only relevant to project manager,
 * and is not used anywhere in the actual engine runtime
 * (same goes for other names like that) */
export interface Project {
	readonly models: readonly ProjectEntity[]
	readonly particles: readonly ProjectParticleDefinition[]
	readonly modelTree: readonly Tree<UUID, NamedId>[]
	readonly collisionGroups: readonly NamedId[]
	readonly inputGroups: readonly NamedId[]
	/** Couples of groups that should be colliding. */
	readonly collisionGroupPairs: readonly (readonly [UUID, UUID])[]
	readonly layers: readonly LayerDefinition[]
	readonly inputBinds: readonly ProjectInputBindSet[]
}

export interface ProjectParticleDefinition extends ParticleDefinition, NamedId {
	/** This only matters to devtool and calculation of `.amount`
	 * in runtime emission type is determined by usage */
	emissionType: "once" | "continuous"
}

export interface LayerDefinition extends NamedId {
	readonly type: LayerType
}

export interface ProjectInputBindSet extends NamedId {
	readonly binds: ProjectInputBind[]
}

export interface ProjectInputBind extends NamedId {
	readonly group: UUID | null
	readonly isHold: boolean
	readonly defaultChords: readonly Chord[]
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

export interface ProjectEntity extends NamedId {
	readonly isStatic: boolean
	readonly shapes: ProjectShape[]
	readonly collisionGroupId: UUID
	readonly layerId: UUID
	readonly texturePath: string
	readonly size: XY
}

export interface ProjectShape {
	readonly id: UUID
	readonly points: readonly (readonly [x: number, y: number])[]
}

export function makeBlankProjectModel(layerId: UUID, collisionGroupId: UUID): ProjectEntity {
	return {
		id: getRandomUUID(),
		layerId,
		collisionGroupId,
		name: "unnamed model",
		size: {x: 1, y: 1},
		texturePath: "",
		isStatic: false,
		shapes: []
	}
}

// name is filename, like the last portion of the file path
export interface TextureFile extends NamedId {
	readonly fullPath: string
}
import {Tree} from "common/tree"
import {getRandomUUID} from "common/uuid"
import {UUID} from "crypto"
import {XY, Chord, LayerType, ParticleDefinition} from "@nartallax/e8"

/** Project is source data for resource pack
 *
 * this data structure only relevant to project manager,
 * and is not used anywhere in the actual engine runtime  */
export interface Project {
	readonly models: readonly ProjectEntity[]
	readonly particles: readonly ProjectParticleDefinition[]
	readonly modelTree: readonly Tree<UUID, NamedId>[]
	// TODO: i'm starting to have second thoughts about readonly-ing everything
	// sure, they are readonly, but it goes without saying
	// and readonly-ing everything just introduces a lot of clutter
	readonly collisionGroups: readonly CollisionGroup[]
	readonly inputGroups: readonly InputGroup[]
	/** Couples of groups that should be colliding. */
	readonly collisionGroupPairs: readonly (readonly [UUID, UUID])[]
	readonly layers: readonly LayerDefinition[]
	readonly inputBinds: readonly ProjectInputBindSet[]
}

export type InputGroup = NamedId
export type CollisionGroup = NamedId

export interface ProjectParticleDefinition extends ParticleDefinition, NamedId {
	/** This only matters to devtool and calculation of `.amount`
	 * in runtime emission type is determined by usage */
	emissionType: "once" | "continuous"
}

export interface LayerDefinition extends NamedId {
	readonly type: LayerType
}

// TODO: rename? we removed Project prefix from everywhere else
export interface ProjectInputBindSet extends NamedId {
	readonly binds: ProjectInputBind[]
}

// TODO: rename? we removed Project prefix from everywhere else
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

// TODO: rename? we removed Project prefix from everywhere else
// TODO: also, it's Entity here, and Model in the engine, let's make up our mind on that
export interface ProjectEntity extends NamedId {
	readonly isStatic: boolean
	readonly shapes: ProjectShape[]
	readonly collisionGroupId: UUID
	readonly layerId: UUID
	readonly texturePath: string
	readonly size: XY
}

// TODO: rename? we removed Project prefix from everywhere else
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
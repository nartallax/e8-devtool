import {Tree} from "common/tree"
import {getRandomUUID} from "common/uuid"
import {UUID} from "crypto"
import {Chord, LayerType, ParticleDefinition} from "@nartallax/e8"
import {XY} from "@nartallax/e8"

/** Project is source data for resource pack
 *
 * "project manager project" is a bit redundant of a name, true,
 * but I want to outline that this data structure only relevant to project manager,
 * and is not used anywhere in the actual engine runtime
 * (same goes for other names like that) */
export interface PromanProject {
	readonly models: readonly PromanProjectEntity[]
	readonly particles: readonly PromanParticleDefinition[]
	readonly modelTree: readonly Tree<UUID, PromanNamedId>[]
	readonly collisionGroups: readonly PromanNamedId[]
	readonly inputGroups: readonly PromanNamedId[]
	/** Couples of groups that should be colliding. */
	readonly collisionGroupPairs: readonly (readonly [UUID, UUID])[]
	readonly layers: readonly PromanLayerDefinition[]
	readonly inputBinds: readonly PromanProjectInputBindSet[]
}

export interface PromanParticleDefinition extends ParticleDefinition, PromanNamedId {
	/** This only matters to proman and calculation of `.amount`
	 * in runtime emission type is determined by usage */
	emissionType: "once" | "continuous"
}

export interface PromanLayerDefinition extends PromanNamedId {
	readonly type: LayerType
}

export interface PromanProjectInputBindSet extends PromanNamedId {
	readonly binds: PromanProjectInputBind[]
}

export interface PromanProjectInputBind extends PromanNamedId {
	readonly group: UUID | null
	readonly isHold: boolean
	readonly defaultChords: readonly Chord[]
}

export function makePromanProject(): PromanProject {
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

export interface PromanNamedId {
	readonly name: string
	readonly id: UUID
}

export interface PromanProjectEntity extends PromanNamedId {
	readonly isStatic: boolean
	readonly shapes: PromanProjectShape[]
	readonly collisionGroupId: UUID
	readonly layerId: UUID
	readonly texturePath: string
	readonly size: XY
}

export interface PromanProjectShape {
	readonly id: UUID
	readonly points: readonly (readonly [x: number, y: number])[]
}

export function makePromanProjectModel(layerId: UUID, collisionGroupId: UUID): PromanProjectEntity {
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

// name is filename, like the last portion of the file
// id is non-stable, but unique among one set of texture files
export interface PromanTextureFile extends PromanNamedId {
	readonly fullPath: string
}
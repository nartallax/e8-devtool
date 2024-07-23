import {UUID} from "common/uuid"
import {XY, Chord, LayerType, StartEnd, DeviatingValueRange} from "@nartallax/e8"
import {getRandomUUID} from "common/uuid"

export type ProjectConfig = {
	/** Resolution of one inworld unit (on x1 zoom)
	Used to determine how to render vector textures, if there are any, and some other values related to resolution. */
	inworldUnitPixelSize: number
	resourcePackPath: string
	// TODO: remove this, refer to textures by ID
	textureDirectoryPath: string
	/** Path that contains classes related to entities */
	// TODO: remove this. we should have tree of ts files related to objects, automatically linked
	// this way, we won't have as much magic as "just name a file with special ending"
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

export interface ProjectParticle {
	id: UUID
	/** This only matters to devtool and calculation of `.amount`
	 * in runtime emission type is determined by usage */
	emissionType: "once" | "continuous"
	layerId: UUID
	texturePath: string
	amount: number
	size: StartEnd<XY>
	rotation: StartEnd<number>
	color: StartEnd<number>
	distance: DeviatingValueRange & {
		progressPower: number
	}
	lifetime: DeviatingValueRange
	angle: number
}

export interface ProjectLayer {
	id: UUID
	type: LayerType
}

export interface ProjectInputBind {
	id: UUID
	groupId: UUID | null
	isHold: boolean
	defaultChords: ProjectChord[]
}

export type ProjectChord = {
	id: UUID
	chord: Chord
}

export const makeBlankProjectConfig = (): ProjectConfig => ({
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
})

type BlankModelParams = {
	collisionGroupId: UUID
	layerId: UUID
}

export const makeBlankModel = ({collisionGroupId, layerId}: BlankModelParams): ProjectModel => ({
	id: getRandomUUID(),
	layerId,
	collisionGroupId,
	size: {x: 1, y: 1},
	texturePath: null,
	isStatic: false,
	shapes: []
})

export interface ProjectModel {
	id: UUID
	isStatic: boolean
	shapes: ProjectShape[]
	collisionGroupId: UUID
	// TODO: if texture is nullable, why layerId isn't? they are linked, might as well be the same
	layerId: UUID
	// TODO: I don't like texture being a path. we should have separate internal directory for textures
	// referring to textures by path introduces exact same problems as referring to everything else by path
	texturePath: string | null
	size: XY
}

export interface ProjectShape {
	id: UUID
	points: [x: number, y: number][]
}
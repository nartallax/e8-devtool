import {ContentPackCollisionGroup, ContentPackInputBind, ContentPackInputGroup, ContentPackLayer, ContentPackModel, ContentPackParticle, contentPackFileExtensions} from "@nartallax/e8"

// TODO: rename "ProjectSomething" to "ContentSomething"...?
export type ProjectObjectType = keyof ProjectObjectToType
export type ProjectObject = ProjectObjectToType[ProjectObjectType]

export type ProjectObjectToType = {
	"model": ContentPackModel
	"particle": ContentPackParticle
	"input bind": ContentPackInputBind
	"input bind group": ContentPackInputGroup
	"collision group": ContentPackCollisionGroup
	"layer": ContentPackLayer
}

export const emptyProjectObjectMakers: {[k in ProjectObjectType]: () => ProjectObjectToType[k]} = {
	model: () => ({size: {x: 1, y: 1}}),
	particle: () => ({
		amount: 1,
		angle: 0,
		color: {
			start: 0xff0000,
			end: 0x00ff00,
			progressPower: 1
		},
		distance: {
			average: 1,
			maxDeviation: 0,
			progressPower: 1
		},
		size: {
			start: {x: 1, y: 1},
			end: {x: 0, y: 0},
			progressPower: 1
		},
		rotation: {
			start: 0,
			end: 0,
			progressPower: 1
		},
		lifetime: {
			average: 1,
			maxDeviation: 0
		}
	}),
	"input bind": () => ({defaultChords: [], isHold: false}),
	"input bind group": () => ({}),
	"collision group": () => ({collidesWithGroupPaths: []}),
	layer: () => ({drawPriority: 0, type: "model"})
}

const projectObjectFilenameSuffix: Record<ProjectObjectType, string> = {
	model: contentPackFileExtensions.model.toLowerCase(),
	particle: contentPackFileExtensions.particle.toLowerCase(),
	"input bind": contentPackFileExtensions.inputBind.toLowerCase(),
	"input bind group": contentPackFileExtensions.inputGroup.toLowerCase(),
	"collision group": contentPackFileExtensions.collisionGroup.toLowerCase(),
	layer: contentPackFileExtensions.layer.toLowerCase()
}

export const getProjectObjectTypeByFilename = (filename: string): ProjectObjectType | null => {
	filename = filename.toLowerCase()
	for(const [key, ext] of Object.entries(projectObjectFilenameSuffix)){
		if(filename.endsWith(ext)){
			return key as ProjectObjectType
		}
	}
	return null
}
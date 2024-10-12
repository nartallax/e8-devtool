import {nonNullOrUndefined} from "common/non_null"
import {ProjectObjectToType, ProjectObjectType} from "data/project_object_types"

/** An object that refers to some other object */
export type ProjectObjectReferrer = {
	/** Path to referring object */
	path: string
	/** Type of referring object */
	type: ProjectObjectType
}


const projectObjectReferrerResolvers: {[k in ProjectObjectType]: (obj: ProjectObjectToType[k]) => (string | undefined | null)[]} = {
	model: model => [model.physics?.collisionGroupPath, model.graphics?.layerPath, model.graphics?.texturePath],
	particle: particle => [particle.graphics?.layerPath, particle.graphics?.texturePath],
	"input bind group": () => [],
	"input bind": bind => [bind.groupPath],
	"collision group": group => [...group.collidesWithGroupPaths],
	layer: () => []
}

/** Having some project object and its type, resolve list of other object's names this object refers to */
export const getProjectObjectReferrers = (obj: unknown, type: ProjectObjectType): string[] => {
	return projectObjectReferrerResolvers[type](obj as any).filter(nonNullOrUndefined)
}
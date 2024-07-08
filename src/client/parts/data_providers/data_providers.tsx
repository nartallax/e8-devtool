import {makeProjectMapIdResolverFactory, makeProjectMapPathResolver} from "client/parts/data_providers/data_resolvers"
import {makeProjectSaveableDataWrapper} from "client/parts/data_providers/project_saveable_data"
import {makeProjectSaveableForestWrapper} from "client/parts/data_providers/project_saveable_forest"
import {UUID} from "common/uuid"
import {ProjectCollisionGroup, ProjectConfig, ProjectInputGroup, ProjectLayerDefinition, ProjectModel, ProjectParticleDefinition} from "data/project"

export const withInputGroupForest = makeProjectSaveableForestWrapper<ProjectInputGroup>({
	forestName: "inputGroupTree",
	mapName: "inputGroups"
})
export const useInputGroupIdResolver = makeProjectMapIdResolverFactory("inputGroups")
export const useInputGroupPath = makeProjectMapPathResolver("inputGroups")

export const withCollisionGroupForest = makeProjectSaveableForestWrapper<ProjectCollisionGroup>({
	forestName: "collisionGroupTree",
	mapName: "collisionGroups"
})
export const useCollisionGroupIdResolver = makeProjectMapIdResolverFactory("collisionGroups")
export const useCollisionGroupPath = makeProjectMapPathResolver("collisionGroups")

export const withLayersForest = makeProjectSaveableForestWrapper<ProjectLayerDefinition>({
	forestName: "layerTree",
	mapName: "layers"
})
export const useLayerIdResolver = makeProjectMapIdResolverFactory("layers")
export const useLayerPath = makeProjectMapPathResolver("layers")

export const withModelForest = makeProjectSaveableForestWrapper<ProjectModel>({
	forestName: "modelTree",
	mapName: "models"
})
export const useModelIdResolver = makeProjectMapIdResolverFactory("models")
export const useModelPath = makeProjectMapPathResolver("models")

export const withParticleForest = makeProjectSaveableForestWrapper<ProjectParticleDefinition>({
	forestName: "particleTree",
	mapName: "particles"
})
export const useParticleIdResolver = makeProjectMapIdResolverFactory("particles")
export const useParticlePath = makeProjectMapPathResolver("particles")

export const withProjectConfig = makeProjectSaveableDataWrapper<ProjectConfig>("config")
export const withCollisionGroupPairs = makeProjectSaveableDataWrapper<[UUID, UUID][]>("collisionGroupPairs")
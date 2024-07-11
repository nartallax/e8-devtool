import {makeProjectMapPathResolver, makeProjectObjectReferrersResolver, makeProjectValueByPathResolver} from "client/parts/data_providers/data_resolvers"
import {makeProjectForestDataProvider} from "client/parts/data_providers/project_forest_data_provider"
import {makeProjectSaveableDataWrapper} from "client/parts/data_providers/project_saveable_data"
import {makeProjectSaveableForestWrapper} from "client/parts/data_providers/project_saveable_forest"
import {UUID} from "common/uuid"
import {ProjectCollisionGroup, ProjectConfig, ProjectInputBind, ProjectInputGroup, ProjectLayerDefinition, ProjectModel, ProjectParticleDefinition} from "data/project"

export const inputGroupProvider = makeProjectForestDataProvider<ProjectInputGroup>({
	mapName: "inputGroups",
	forestName: "inputGroupTree",
	itemType: "input bind group"
})

export const collisionGroupProvider = makeProjectForestDataProvider<ProjectCollisionGroup>({
	forestName: "collisionGroupTree",
	mapName: "collisionGroups",
	itemType: "collision group"
})

export const layerProvider = makeProjectForestDataProvider<ProjectLayerDefinition>({
	forestName: "layerTree",
	mapName: "layers",
	itemType: "layer"
})

export const inputBindProvider = makeProjectForestDataProvider<ProjectInputBind>({
	forestName: "inputBindTree",
	mapName: "inputBinds",
	itemType: "input bind"
})

export const modelProvider = makeProjectForestDataProvider<ProjectModel>({
	forestName: "modelTree",
	mapName: "models",
	itemType: "model"
})

export const particleProvider = makeProjectForestDataProvider<ProjectParticleDefinition>({
	forestName: "particleTree",
	mapName: "particles",
	itemType: "particle"
})


export const withInputGroupForest = makeProjectSaveableForestWrapper<ProjectInputGroup>({
	forestName: "inputGroupTree",
	mapName: "inputGroups"
})
export const useInputGroupResolver = makeProjectValueByPathResolver<ProjectInputGroup>("inputGroups")
export const useInputGroupPath = makeProjectMapPathResolver("inputGroups")


export const withCollisionGroupForest = makeProjectSaveableForestWrapper<ProjectCollisionGroup>({
	forestName: "collisionGroupTree",
	mapName: "collisionGroups"
})
export const useCollisionGroupResolver = makeProjectValueByPathResolver<ProjectCollisionGroup>("collisionGroups")
export const useCollisionGroupPath = makeProjectMapPathResolver("collisionGroups")


export const withLayersForest = makeProjectSaveableForestWrapper<ProjectLayerDefinition>({
	forestName: "layerTree",
	mapName: "layers"
})
export const useLayerResolver = makeProjectValueByPathResolver<ProjectLayerDefinition>("layers")
export const useLayerPath = makeProjectMapPathResolver("layers")


export const withInputBindForest = makeProjectSaveableForestWrapper<ProjectInputBind>({
	forestName: "inputBindTree",
	mapName: "inputBinds"
})
export const useInputBindResolver = makeProjectValueByPathResolver<ProjectInputBind>("inputBinds")
export const useInputBindsWithGroupByPath = makeProjectObjectReferrersResolver("input bind", "group", useInputGroupResolver)


export const withModelForest = makeProjectSaveableForestWrapper<ProjectModel>({
	forestName: "modelTree",
	mapName: "models"
})
export const useModelResolver = makeProjectValueByPathResolver<ProjectModel>("models")
export const useModelPath = makeProjectMapPathResolver("models")
export const useModelsWithLayerByPath = makeProjectObjectReferrersResolver("model", "layerId", useLayerResolver)
export const useModelsWithCollisionGroupByPath = makeProjectObjectReferrersResolver("model", "collisionGroupId", useCollisionGroupResolver)


export const withParticleForest = makeProjectSaveableForestWrapper<ProjectParticleDefinition>({
	forestName: "particleTree",
	mapName: "particles"
})
export const useParticleResolver = makeProjectValueByPathResolver<ProjectParticleDefinition>("particles")
export const useParticlePath = makeProjectMapPathResolver("particles")
export const useParticlesWithLayerByPath = makeProjectObjectReferrersResolver("particle", "layerId", useLayerResolver)


export const withProjectConfig = makeProjectSaveableDataWrapper<ProjectConfig>("config")
export const withCollisionGroupPairs = makeProjectSaveableDataWrapper<[UUID, UUID][]>("collisionGroupPairs")
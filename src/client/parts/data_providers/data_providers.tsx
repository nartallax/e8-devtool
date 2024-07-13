import {makeProjectForestDataProvider} from "client/parts/data_providers/project_forest_data_provider"
import {makeProjectSaveableDataWrapper} from "client/parts/data_providers/project_saveable_data"
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

export const projectConfigProvider = makeProjectSaveableDataWrapper<ProjectConfig>("config")
export const collisionPairsProvider = makeProjectSaveableDataWrapper<[UUID, UUID][]>("collisionGroupPairs")
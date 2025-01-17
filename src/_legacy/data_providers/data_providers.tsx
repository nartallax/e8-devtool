import {makeApiForestDataProvider} from "client/parts/data_providers/api_forest_data_provider"
import {makeApiSimpleDataProvider} from "client/parts/data_providers/api_simple_data_provider"
import {ProjectCollisionGroup, ProjectInputBind, ProjectInputGroup, ProjectLayer, ProjectModel, ProjectParticle} from "data/project"

export const inputGroupProvider = makeApiForestDataProvider<ProjectInputGroup>(
	"input bind group",
	"inputGroup",
	() => {
		const {getReferrers: getBindReferrers} = inputBindProvider.useFetchers()
		return group => [getBindReferrers("groupId", group.id)]
	}
)

export const collisionGroupProvider = makeApiForestDataProvider<ProjectCollisionGroup>(
	"collision group",
	"collisionGroup",
	() => {
		const {getReferrers: getModelReferrers} = modelProvider.useFetchers()
		return group => [getModelReferrers("collisionGroupId", group.id)]
	}
)

export const layerProvider = makeApiForestDataProvider<ProjectLayer>(
	"layer",
	"layer",
	() => {
		const {getReferrers: getModelReferrers} = modelProvider.useFetchers()
		const {getReferrers: getParticleReferrers} = particleProvider.useFetchers()
		return layer => [
			getModelReferrers("layerId", layer.id),
			getParticleReferrers("layerId", layer.id)
		]
	}
)

export const inputBindProvider = makeApiForestDataProvider<ProjectInputBind>(
	"input bind",
	"inputBind"
)

export const modelProvider = makeApiForestDataProvider<ProjectModel>(
	"model",
	"model"
)

export const particleProvider = makeApiForestDataProvider<ProjectParticle>(
	"particle",
	"particle"
)

export const projectConfigProvider = makeApiSimpleDataProvider("projectConfig",
	api => api.getProjectConfig(),
	(api, config) => api.updateProjectConfig(config)
)

export const collisionPairsProvider = makeApiSimpleDataProvider("collisionPairs",
	api => api.getCollisionPairs(),
	(api, pairs) => api.updateCollisionPairs(pairs)
)
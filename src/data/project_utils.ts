import {Project, ProjectInputBindSet, ProjectEntity} from "data/project"
import {copySortBy, sortBy} from "common/sort_by"
import {getTreeLeaves} from "common/tree"

// only this function should be used to get all project modals
// because it will guarantee that the order is the same each time
// and order is important, because index of the model is its id
/** @returns [all folder labels, in descendance order; model] */
export function getAllProjectModelsWithFolders(project: Project): [string[], ProjectEntity][] {
	const allModels: [string[], ProjectEntity][] = []
	const modelsById = new Map(project.models.map(model => [model.id, model]))
	for(const rootFolder of project.modelTree){
		for(const [folders, id] of getTreeLeaves(rootFolder)){
			allModels.push([folders.map(folder => folder.value.name), modelsById.get(id)!])
		}
	}
	sortBy(allModels, x => x[1].id)
	return allModels
}

export function getAllProjectModels(project: Project): ProjectEntity[] {
	return getAllProjectModelsWithFolders(project).map(x => x[1])
}

export function getSortedProjectBinds(project: Project): ProjectInputBindSet[] {
	return copySortBy(project.inputBinds, x => x.id).map(bindSet => ({
		...bindSet,
		binds: copySortBy(bindSet.binds, x => x.id)
	}))
}
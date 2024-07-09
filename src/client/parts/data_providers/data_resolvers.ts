import {useProject} from "client/parts/project_context"
import {Tree} from "common/tree"
import {UUID} from "common/uuid"
import {Project, ProjectInputBind, ProjectModel, ProjectParticleDefinition} from "data/project"
import {mappedForestToArrayWithPath, mergePath} from "data/project_utils"
import {useCallback, useMemo} from "react"

export const makeProjectMapIdResolverFactory = (propName: keyof Project) => {
	const useIdByPathFactory = () => {
		const [project] = useProject()
		const map = project[propName] as Record<string, {id: UUID}>
		return useCallback(async(path: string): Promise<UUID> => {
			const item = map[path]
			if(!item){
				throw new Error("Cannot resolve path " + path)
			}
			return item.id
		}, [map])
	}
	return useIdByPathFactory
}

export const makeProjectMapPathResolver = (propName: keyof Project) => {
	const usePathById = (id: UUID | null): string | null => {
		const [project] = useProject()
		const map = project[propName] as Record<string, {id: UUID}>
		const path = useMemo(() => {
			if(id === null){
				return null
			}
			for(const path in map){
				const item = map[path]!
				if(item.id === id){
					return path
				}
			}
			throw new Error("Cannot resolve path by id " + id)
		}, [id, map])
		return path
	}
	return usePathById
}

type ProjectObjectReferrerType = "model" | "particle" | "input bind"
type ProjectObjectReferrerMap = {
	model: ProjectModel
	particle: ProjectParticleDefinition
	["input bind"]: ProjectInputBind
}
export type ProjectObjectReferrer = {path: string, type: ProjectObjectReferrerType}
export const makeProjectObjectReferrersResolver = <T extends ProjectObjectReferrerType>(
	type: T, referrerPropName: keyof ProjectObjectReferrerMap[T], useIdResolver: () => (path: string) => Promise<UUID>
): (path: string | null) => Promise<ProjectObjectReferrer[]> => {

	const useReferrers = (path: string | null) => {
		const [project] = useProject()
		const [forest, map] = getProjectReferrers(type, project)
		const resolveId = useIdResolver()
		return useMemo(async() => {
			if(path === null){
				return []
			}

			const id = await resolveId(path)

			return mappedForestToArrayWithPath(forest, map)
				.filter(([obj]) => obj[referrerPropName] === id)
				.map(([,path]) => ({path: mergePath(path), type}))
		}, [resolveId, path, forest, map])
	}

	return useReferrers
}

const getProjectReferrers = <T extends ProjectObjectReferrerType>(type: T, project: Project): [Tree<string, string>[], Record<string, ProjectObjectReferrerMap[T]>] => {
	switch(type){
		case "input bind": return [project.inputBindTree, project.inputBinds] as any
		case "model": return [project.modelTree, project.models] as any
		case "particle": return [project.particleTree, project.particles] as any
	}
	throw new Error("unreachable")
}
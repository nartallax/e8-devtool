import {useProject} from "client/parts/project_context"
import {UUID} from "common/uuid"
import {Project} from "data/project"
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
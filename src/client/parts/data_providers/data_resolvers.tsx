import {useProject} from "client/parts/project_context"
import {UUID} from "crypto"
import {Project} from "data/project"
import {useMemo} from "react"

export const makeProjectMapIdResolver = (propName: keyof Project) => {
	const useIdByPath = (path: string): UUID => {
		const [project] = useProject()
		const map = project[propName] as Record<string, {id: UUID}>
		const item = map[path]
		if(!item){
			throw new Error("Cannot resolve path " + path)
		}
		return item.id
	}
	return useIdByPath
}

export const makeProjectMapPathResolver = (propName: keyof Project) => {
	const usePathById = (id: UUID): string => {
		const [project] = useProject()
		const map = project[propName] as Record<string, {id: UUID}>
		const path = useMemo(() => {
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
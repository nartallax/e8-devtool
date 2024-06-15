type ClassNamePart = string | null | undefined | false | Record<string, boolean | null | undefined>

export const cn = (...parts: ClassNamePart[]) => {
	const result: string[] = []
	for(const part of parts){
		if(!part){
			continue
		}
		if(typeof(part) === "string"){
			result.push(part)
			continue
		}
		for(const [key, value] of Object.entries(part)){
			if(value){
				result.push(key)
			}
		}
	}
	return result.join(" ")
}
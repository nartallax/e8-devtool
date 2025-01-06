/** Deep-equality check. Only applicable for simple JSON-able values. */
export const areDtosDeepEqual = (a: any, b: any): boolean => {
	if(a === b){
		return true
	}

	if(typeof(a) !== typeof(b)){
		return false
	}

	switch(typeof a){
		case "object":{
			if((a === null) !== (b === null)){
				return false
			}

			if(Array.isArray(a)){
				if(!Array.isArray(b)){
					return false
				}
				if(a.length !== b.length){
					return false
				}
				for(let i = 0; i < a.length; i++){
					if(!areDtosDeepEqual(a[i], b[i])){
						return false
					}
				}
				return true
			}

			for(const k in a){
				if(!(k in b) || !areDtosDeepEqual(a[k], b[k])){
					return false
				}
			}
			for(const k in b){
				if(!(k in a)){
					return false
				}
			}
			return true
		}
		default: return false
	}
}
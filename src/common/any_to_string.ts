import {errToString} from "common/err_to_string"

export const anyToString = (x: unknown): string => {
	switch(typeof(x)){
		case "string": return x
		case "number":
		case "undefined":
		case "bigint":
		case "boolean": return x + ""
		case "object": {
			if(x === null){
				return x + ""
			}
			if(x instanceof Error){
				return errToString(x)
			}
			// eslint-disable-next-line @typescript-eslint/no-base-to-string
			return x.toString()
		}
		case "function": return x.toString()
		case "symbol": return x.toString()
	}
}
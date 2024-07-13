import {PropsWithChildren} from "react"

type NoNull<T> = T extends null ? never : T
type NoNullObjValues<T> = {[key in keyof T]: NoNull<T[key]>}


export function withDataLoaded<P extends object, D extends Record<string, unknown>>(useData: (props: P) => D, Component: React.FC<P & NoNullObjValues<D>>) {
	return (props: PropsWithChildren<P>) => {
		const dataObj = useData(props)
		for(const value of Object.values(dataObj)){
			if(value === null){
				return null
			}
		}

		const {children} = props
		return <Component {...dataObj as NoNullObjValues<D>} {...props}>{children}</Component>
	}
}
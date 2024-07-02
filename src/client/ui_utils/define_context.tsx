import {PropsWithChildren, createContext, useContext} from "react"

const emptyContext = Symbol()

type Props<T, I> = {
	name?: string
	useValue: (providerProps: I) => T
	additionalChildren?: (context: T) => React.ReactNode
	NestedWrapComponent?: React.FC<PropsWithChildren<{context: T}>>
}

/** Create context (as in, React.createContext()), but in more safe and predictable way */
export const defineContext = <T, I>({
	name, useValue: getValue, additionalChildren, NestedWrapComponent
}: Props<T, I>): [
	provider: (props: React.PropsWithChildren<I>) => React.ReactNode,
	useThisContext: () => T
] => {
	const Context = createContext(emptyContext as unknown as T)

	const useThisContext = () => {
		const value = useContext(Context)
		if(value === emptyContext){
			throw new Error(`Cannot use context${name ? " " + name : ""}: it's not provided.`)
		}
		return value
	}

	const Provider = (props: PropsWithChildren<I>) => {
		const {children} = props
		const value = getValue(props)
		let result = (
			<>
				{children}
				{additionalChildren?.(value)}
			</>
		)

		if(NestedWrapComponent){
			result = (
				<NestedWrapComponent context={value}>
					{result}
				</NestedWrapComponent>
			)
		}

		result = <Context.Provider value={value}>{result}</Context.Provider>

		return result
	}

	if(name){
		Provider.displayName = name + ".Provider"
	}

	return [Provider, useThisContext]
}
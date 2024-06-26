import {PropsWithChildren, createContext, useContext, useMemo} from "react"

const noContext = Symbol("no-nested-context-value")

type Args<PR, VR, PN, VN> = {
	name?: string
	useRootValue: (props: PR) => VR
	useNestedValue: (props: PN, root: VR, parents: VN[]) => VN
}

type Result<PR, VR, PN, VN> = {
	RootProvider: React.FC<PropsWithChildren<PR>>
	NestedProvider: React.FC<PropsWithChildren<PN>>
	useRootContext: () => VR
	useNestedContext: () => {parents: VN[], value: VN}
}

/** Define a context that consists of two parts -
root, which provides some service,
and nested context, which supplies root with some additional settings/parameters/cases
Nested context allows us to understand position of context-using component in the tree, which is sometimes useful */
export function defineNestedContext<PR, VR, PN, VN>({useRootValue, useNestedValue, name}: Args<PR, VR, PN, VN>): Result<PR, VR, PN, VN> {
	const RootContext = createContext<VR>(noContext as any)
	const useRootContext = () => {
		const rootContext = useContext(RootContext)
		if(rootContext === noContext){
			throw new Error(`No root context defined${name ? " for " + name : ""}`)
		}
		return rootContext
	}

	const NestedContext = createContext<{parents: VN[], value: VN}>(noContext as any)
	const useNestedContext = () => {
		const value = useContext(NestedContext)
		if(value as unknown === noContext){
			throw new Error(`No nested context defined${name ? " for " + name : ""}`)
		}
		return value
	}

	const RootProvider = (props: PropsWithChildren<PR>) => {
		const {children} = props
		const value = useRootValue(props)
		return (
			<RootContext.Provider value={value}>
				{children}
			</RootContext.Provider>
		)
	}

	const NestedProvider = (props: PropsWithChildren<PN>) => {
		const rootContext = useRootContext()
		const parentContext = useContext(NestedContext)

		const parents: VN[] = useMemo(() => {
			if(parentContext as unknown === noContext){
				return []
			} else {
				return [...parentContext.parents, parentContext.value]
			}
		}, [parentContext])

		const {children} = props
		const value = useNestedValue(props, rootContext, parents)
		const contextValue = useMemo(() => ({parents, value}), [parents, value])
		return (
			<NestedContext.Provider value={contextValue}>
				{children}
			</NestedContext.Provider>
		)
	}

	return {RootProvider, NestedProvider, useRootContext, useNestedContext}
}
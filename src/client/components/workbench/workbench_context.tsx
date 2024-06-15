import {MutableRefObject, PropsWithChildren, createContext, useContext} from "react"

const defaultWorkbenchContext = {
	width: 1,
	height: 1,
	pointerEventToWorkbenchCoords: (e: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent) => {
		void e
		return {x: 0, y: 0}
	},
	resetPosition: () => {/* nothing! */}
}

export type WorkbenchContextValue = typeof defaultWorkbenchContext

const WorkbenchContext = createContext(defaultWorkbenchContext)

type Props = WorkbenchContextValue & {
	readonly contextRef?: MutableRefObject<WorkbenchContextValue | null>
}

export const WorkbenchContextProvider = ({width, height, pointerEventToWorkbenchCoords, resetPosition, children, contextRef}: PropsWithChildren<Props>) => {
	const value: WorkbenchContextValue = {width, height, pointerEventToWorkbenchCoords, resetPosition}
	if(contextRef){
		contextRef.current = value
	}
	return <WorkbenchContext.Provider value={value}>{children}</WorkbenchContext.Provider>
}

export const useWorkbenchContext = (): WorkbenchContextValue => useContext(WorkbenchContext)
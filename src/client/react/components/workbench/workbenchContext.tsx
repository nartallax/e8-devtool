import {PropsWithChildren, createContext, useContext} from "react"

const defaultWorkbenchContext = {
	width: 1,
	height: 1,
	pointerEventToWorkbenchCoords: (e: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent) => {
		void e
		return {x: 0, y: 0}
	}
}

type WorkbenchContextValue = typeof defaultWorkbenchContext

const WorkbenchContext = createContext(defaultWorkbenchContext)

export const WorkbenchContextProvider = ({width, height, pointerEventToWorkbenchCoords, children}: PropsWithChildren<WorkbenchContextValue>) => {
	return <WorkbenchContext.Provider value={{width, height, pointerEventToWorkbenchCoords}}>{children}</WorkbenchContext.Provider>
}

export const useWorkbenchContext = (): WorkbenchContextValue => useContext(WorkbenchContext)
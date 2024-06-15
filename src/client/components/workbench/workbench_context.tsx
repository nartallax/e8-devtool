import {XY} from "@nartallax/e8"
import {defineContext} from "client/ui_utils/define_context"
import {MutableRefObject} from "react"

export type WorkbenchContextValue = {
	width: number
	height: number
	pointerEventToWorkbenchCoords: (e: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent) => XY
	resetPosition: () => void
}

export const [WorkbenchContextProvider, useWorkbenchContext] = defineContext({
	name: "WorkbenchContext",
	useValue: ({contextRef, ...value}: WorkbenchContextValue & {contextRef?: MutableRefObject<WorkbenchContextValue | null>}) => {
		if(contextRef){
			contextRef.current = value
		}
		return value
	}
})
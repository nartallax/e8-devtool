import {XY} from "@nartallax/e8"
import {defineContext} from "client/ui_utils/define_context"
import {MutableRefObject} from "react"

export type WorkbenchContextValue = {
	readonly width: number
	readonly height: number
	readonly pointerEventToWorkbenchCoords: (e: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent) => XY
	readonly resetPosition: () => void
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
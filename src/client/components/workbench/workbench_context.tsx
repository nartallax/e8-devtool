import {XY} from "@nartallax/e8"
import {defineContext} from "client/ui_utils/define_context"
import {AnyPointerEvent} from "client/ui_utils/use_mouse_drag"
import {MutableRefObject} from "react"

export type WorkbenchContextValue = {
	width: number
	height: number
	pointerEventToWorkbenchCoords: (e: AnyPointerEvent) => XY
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
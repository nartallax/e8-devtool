export const isUndoKeypress = (e: KeyboardEvent | React.KeyboardEvent) => {
	const isNormalUndo = e.code === "KeyZ" && e.ctrlKey
	const isMacosUndo = e.code === "KeyZ" && e.metaKey && !e.shiftKey
	return isNormalUndo || isMacosUndo
}

export const isRedoKeypress = (e: KeyboardEvent | React.KeyboardEvent) => {
	const isNormalRedo = e.code === "KeyY" && e.ctrlKey
	const isMacosRedo = e.code === "KeyZ" && e.metaKey && e.shiftKey
	return isNormalRedo || isMacosRedo
}

export const preventUndoRedoGlobally = () => {
	document.body.addEventListener("beforeinput", e => {
		if(e.inputType === "historyUndo" || e.inputType === "historyRedo"){
			e.preventDefault()
		}
	}, {capture: true})
}

export const isArrowKeypress = (e: KeyboardEvent | React.KeyboardEvent) => {
	return (e.code === "ArrowLeft" || e.code === "ArrowRight" || e.code === "ArrowDown" || e.code === "ArrowUp")
}
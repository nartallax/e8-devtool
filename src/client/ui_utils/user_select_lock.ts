let lockLevel = 0

export const lockUserSelect = () => {
	lockLevel++
	if(lockLevel === 1){
		document.body.style.userSelect = "none"
	}
}

export const unlockUserSelect = () => {
	lockLevel--
	if(lockLevel === 0){
		document.body.style.userSelect = ""
	}
}
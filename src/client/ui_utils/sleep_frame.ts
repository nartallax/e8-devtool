export const sleepFrame = () => new Promise<void>(ok => requestAnimationFrame(() => {
	ok()
}))
export class CallResolver {

	private frame: ReturnType<typeof requestAnimationFrame> | null = null
	private calls: {priority: number, ok: () => void}[] = []

	resolve(priority: number): Promise<void> {
		return new Promise(ok => {
			this.calls.push({priority, ok})
			if(this.frame === null){
				this.frame = requestAnimationFrame(() => this.runCall())
			}
		})
	}

	private runCall(): void {
		this.frame = null
		const highestPriority = this.calls.map(x => x.priority).reduce((a, b) => Math.max(a, b), 0)
		const selectedCalls = this.calls.filter(x => x.priority === highestPriority)
		this.calls.length = 0
		if(selectedCalls.length === 0){
			console.warn("Trying to run buffered calls, but there are none...? How did this even happen.")
			return
		}
		if(selectedCalls.length > 1){
			console.warn(`There are more than one call with equal priority, ${highestPriority}. This may lead to unintended consequences.`)
		}
		for(const call of selectedCalls){
			call.ok()
		}
	}

}
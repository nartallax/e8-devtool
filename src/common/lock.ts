export class Lock {

	private isLocked = false

	private waiters: (() => void)[] = []

	async withLock<T>(handler: () => Promise<T>): Promise<T> {
		if(this.isLocked){
			await this.waitUnlock()
		} else {
			this.isLocked = true
		}


		try {
			return await handler()
		} finally {
			this.tryUnlock()
		}
	}

	private waitUnlock(): Promise<void> {
		return new Promise(ok => this.waiters.push(ok))
	}

	private tryUnlock(): void {
		if(this.waiters.length > 0){
			const firstWaiter = this.waiters[0]!
			this.waiters = this.waiters.slice(1)
			firstWaiter()
		} else {
			this.isLocked = false
		}
	}

}
/** A stack of states. Allows to organize undo/redo behaviour. */
export class StateStack<T, M = never> {

	private states: {data: T, meta?: M}[] = []
	/** A number that points the current state.
	 * It can be smaller than array length because of undo */
	private statePointer = -1

	constructor(private maxStatesStored: number, initialState: T, initialStateMeta?: M) {
		this.storeState(initialState, initialStateMeta)
	}

	storeState(data: T, meta?: M): void {
		this.dropUndoneStates()
		this.states.push({data, meta})
		this.statePointer = this.states.length - 1
		this.dropExcessStates()
	}

	private dropUndoneStates(): void {
		if(this.states.length - 1 > this.statePointer){
			this.states = this.states.slice(0, this.statePointer + 1)
			this.statePointer = this.states.length - 1
		}
	}

	private dropExcessStates(): void {
		if(this.states.length > this.maxStatesStored){
			const statesDropped = this.states.length - this.maxStatesStored
			this.states = this.states.slice(statesDropped)
			this.statePointer -= statesDropped
		}
	}

	peekMeta(): M | undefined {
		return this.states[this.statePointer]!.meta
	}

	canUndo(): boolean {
		return this.statePointer > 0
	}

	undo(): T {
		if(!this.canUndo()){
			throw new Error("Cannot undo")
		}
		this.statePointer -= 1
		return this.states[this.statePointer]!.data
	}

	canRedo(): boolean {
		return this.statePointer < this.states.length - 1
	}

	redo(): T {
		if(!this.canRedo()){
			throw new Error("Cannot redo")
		}
		this.statePointer += 1
		return this.states[this.statePointer]!.data
	}

}
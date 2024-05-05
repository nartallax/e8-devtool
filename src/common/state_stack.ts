import {WBox} from "@nartallax/cardboard"

/** A stack of states. Allows to organize undo/redo behaviour.
 *
 * Note that it doesn't subscribe to the box.
 * You expected to call .storeState() each time you want to store the state.
 * (this is because sometimes data can change a lot, but one change doesn't signify an end of UI operation) */
export class StateStack<T> {

	private states: T[] = []
	/** A number that points the current state.
	 * It can be smaller than array length because of undo */
	private statePointer = -1

	constructor(private readonly maxStatesStored: number, readonly box: WBox<T>) {
		this.storeState()
	}

	storeState(): void {
		this.dropUndoneStates()
		this.states.push(this.box.get())
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

	private restoreCurrentState(): void {
		const state = this.states[this.statePointer]!
		this.box.set(state)
	}

	canUndo(): boolean {
		return this.statePointer > 0
	}

	undo(): void {
		if(!this.canUndo()){
			return
		}
		this.statePointer -= 1
		this.restoreCurrentState()
	}

	canRedo(): boolean {
		return this.statePointer < this.states.length - 1
	}

	redo(): void {
		if(!this.canRedo()){
			return
		}
		this.statePointer += 1
		this.restoreCurrentState()
	}

}
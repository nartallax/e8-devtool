/** Map that maps a pair of unique values to each other
Can get either one by other one for O(1) */
export class DualMap<A, B> {
	private atob = new Map<A, B>()
	private btoa = new Map<B, A>()

	set(a: A, b: B) {
		if(this.atob.has(a)){
			const oldB = this.atob.get(a)!
			const oldA = this.btoa.get(b)!
			// this is the way to avoid weird several-to-one links
			// for example, initial link is 1 <-> 2
			// but then we call set(1, 3)
			// if we don't delete link "2 is linked to 1" in map b, then we'll have 1 <-> 3, 1 <- 2
			// which shouldn't happen
			this.atob.delete(oldA)
			this.btoa.delete(oldB)
		}
		this.atob.set(a, b)
		this.btoa.set(b, a)
	}

	getA(b: B): A {
		const result = this.btoa.get(b)
		if(!result){
			throw new Error(`No mapping for ${b}`)
		}
		return result
	}

	getB(a: A): B {
		const result = this.atob.get(a)
		if(!result){
			throw new Error(`No mapping for ${a}`)
		}
		return result
	}

	deleteA(a: A): void {
		if(!this.atob.has(a)){
			return
		}
		const b = this.atob.get(a)!
		this.atob.delete(a)
		this.btoa.delete(b)
	}

	deleteB(b: B): void {
		if(!this.btoa.has(b)){
			return
		}
		const a = this.btoa.get(b)!
		this.atob.delete(a)
		this.btoa.delete(b)
	}
}
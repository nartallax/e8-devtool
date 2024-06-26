import {defineNestedContext} from "client/ui_utils/define_nested_context"
import {Tree, isTreeBranch} from "common/tree"
import {useCallback, useEffect, useMemo, useRef, useState} from "react"

type Forest<T> = Tree<never, T>[]

type Args<PR, VR, PN, VN> = {
	useRootValue: (props: PR, services: TreeContextServices<VN>) => VR
	// result of this function should be useMemo'd
	useNestedValue: (props: PN) => VN
	name?: string
}

/** A nested context which builds a tree */
export function defineNestedTreeContext<PR, VR, PN, VN>({useRootValue, useNestedValue, name}: Args<PR, VR, PN, VN>) {
	return defineNestedContext({
		name,

		useRootValue: (props: PR) => {
			const [forest, setForestState] = useState<Forest<VN>>([])
			const forestRef = useRef(forest)
			forestRef.current = forest

			const setForest = useCallback((valueOrCallback: Forest<VN> | ((oldForest: Forest<VN>) => Forest<VN>)) => {
				if(typeof(valueOrCallback) === "function"){
					setForestState(() => {
						return forestRef.current = (valueOrCallback as ((oldForest: Forest<VN>) => Forest<VN>))(forestRef.current)
					})
				} else {
					setForestState(forestRef.current = valueOrCallback)
				}
			}, [])

			const treeServices = useMemo(() => new TreeContextServices(forest), [forest])
			return {treeServices, forest, setForest, value: useRootValue(props, treeServices)}
		},

		useNestedValue: (props: PN, root, parents: VN[]) => {
			const {setForest} = root
			const value = useNestedValue(props)

			useEffect(() => {
				setForest(forest => addTree(forest, value, parents, 0))
				return () => setForest(forest => deleteTree(forest, value, parents, 0))
			}, [value, parents, setForest])

			return value
		}
	})
}

class TreeContextServices<T> {

	constructor(readonly forest: Forest<T>) {}

	/** Returns array of values, sorted by depth in the forest, roots (zero depth) go first */
	getSortedByDepth(filter?: (value: T) => boolean): T[] {
		let forest = this.forest
		if(filter){
			forest = filterForest(forest, filter)
		}
		const result: T[] = []
		sortForestByDepth(forest, result)
		return result
	}
}

function addTree<T>(forest: Forest<T>, child: T, parents: T[], parentIndex: number): Forest<T> {
	const result: Forest<T> = []
	const parent = parents[parentIndex]
	if(!parent){
		result.push({children: [], value: child})
	} else {
		let found = false
		for(const tree of forest){
			// wonder if referential equality is good enough here
			if(isTreeBranch(tree) && tree.value === parent){
				found = true
				result.push({
					...tree,
					children: addTree(tree.children, child, parents, parentIndex + 1)
				})
			} else {
				result.push(tree)
			}
		}
		if(!found){
			throw new Error("Cannot find parent in existing tree.")
		}
	}
	return result
}

function deleteTree<T>(forest: Forest<T>, child: T, parents: T[], parentIndex: number): Forest<T> {
	const parent = parents[parentIndex]
	if(!parent){
		const result = forest.filter(tree => tree.value !== child)
		if(result.length === forest.length){
			throw new Error("Failed to delete tree: child not found")
		}
		return result
	}

	const result: Forest<T> = []
	for(const tree of forest){
		if(isTreeBranch(tree) && tree.value === parent){
			result.push({...tree, children: deleteTree(tree.children, child, parents, parentIndex + 1)})
		} else {
			result.push(tree)
		}
	}

	// at this point, it's possible to not update a single tree in the forest
	// it can be fine in case parent was deleted before child, so we don't need to raise errors
	return result
}

function filterForest<T>(forest: Forest<T>, filter: (value: T) => boolean): Forest<T> {
	const result: Forest<T> = []
	for(const tree of forest){
		const children = isTreeBranch(tree) ? filterForest(tree.children, filter) : []
		if(filter(tree.value) || children.length !== 0){
			result.push({...tree, children})
		}
	}
	return result
}

function sortForestByDepth<T>(forest: Forest<T>, result: T[]): void {
	const nextLevel: Forest<T> = []
	for(const tree of forest){
		result.push(tree.value)
		if(isTreeBranch(tree)){
			nextLevel.push(...tree.children)
		}
	}

	if(nextLevel.length > 0){
		sortForestByDepth(nextLevel, result)
	}
}
import {Tree, isTreeBranch} from "@nartallax/forest"
import {defineNestedContext} from "client/ui_utils/define_nested_context"
import {SetState} from "client/ui_utils/react_types"
import {UUID, getRandomUUID} from "common/uuid"
import {useCallback, useEffect, useMemo, useRef, useState} from "react"

type Trees<T> = readonly Tree<T, UUID>[]

type Args<PR, VR, PN, VN> = {
	useRootValue: (props: PR, services: TreeContextServices<VN>) => VR
	// result of this function should be useMemo'd
	useNestedValue: (props: PN) => VN
	name?: string
}

type NestedValue<VN> = {
	value: VN
	rootId: UUID
	id: UUID
}
type RootValue<VN, VR> = {
	treeServices: TreeContextServices<VN>
	setForest: SetState<Trees<VN>>
	id: UUID
	value: VR
}

/** A nested context which builds a tree */
export function defineNestedTreeContext<PR, VR, PN, VN>({useRootValue, useNestedValue, name}: Args<PR, VR, PN, VN>) {
	return defineNestedContext<PR, RootValue<VN, VR>, PN, NestedValue<VN>>({
		name,

		useRootValue: (props: PR) => {
			const [forest, setForestState] = useState<Trees<VN>>([])
			const forestRef = useRef(forest)
			forestRef.current = forest

			const setForest = useCallback((valueOrCallback: Trees<VN> | ((oldForest: Trees<VN>) => Trees<VN>)) => {
				if(typeof(valueOrCallback) === "function"){
					setForestState(() => {
						return forestRef.current = (valueOrCallback as ((oldForest: Trees<VN>) => Trees<VN>))(forestRef.current)
					})
				} else {
					setForestState(forestRef.current = valueOrCallback)
				}
			}, [])

			const idRef = useRef(getRandomUUID())
			const treeServices = useMemo(() => new TreeContextServices(forest), [forest])
			return {
				treeServices,
				setForest,
				value: useRootValue(props, treeServices),
				id: idRef.current
			}
		},

		useNestedValue: (props: PN, root, parents) => {
			const {setForest, id: rootId} = root
			const value = useNestedValue(props)
			const id = useRef(getRandomUUID()).current

			useEffect(() => {

				let parentIds: UUID[]
				const lastParentRootId = parents[parents.length - 1]?.rootId
				if(lastParentRootId !== rootId){
					// sometimes we want to nest root contexts too (in case of hotkey contexts for example)
					// and we need to avoid using nested contexts from another root as parents for this one
					parentIds = []
				} else {
					parentIds = parents.map(parent => parent.id)
				}

				setForest(forest => addTree({
					forest, child: value, childId: id, parentIds, parentIndex: 0
				}))
				return () => {
					setForest(forest => deleteTree({
						forest, childId: id, parentIds, parentIndex: 0
					}))
				}
			}, [value, parents, setForest, rootId, id])

			return useMemo(() => ({value, rootId, id}), [value, rootId, id])
		}
	})
}

class TreeContextServices<T> {

	constructor(readonly forest: Trees<T>) {}

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

function addTree<T>({
	forest, child, childId, parentIds, parentIndex
}: {forest: Trees<T>, child: T, childId: UUID, parentIds: UUID[], parentIndex: number}): Trees<T> {
	let result: Tree<T, UUID>[] = []
	const parentId = parentIds[parentIndex]
	if(!parentId){
		let haveBranch = false
		result = forest.map(tree => {
			if(tree.value !== childId || !isTreeBranch(tree)){
				return tree
			}

			haveBranch = true
			// result could have this tree already if its descendant was added first
			const newChildren: Tree<T, UUID>[] = tree.children.filter(child => isTreeBranch(child))
			newChildren.push({value: child})
			return {
				...tree,
				children: newChildren
			}
		})

		if(!haveBranch){
			result.push({children: [{value: child}], value: childId})
		}
	} else {
		let found = false
		for(const tree of forest){
			// wonder if referential equality is good enough here
			if(isTreeBranch(tree) && tree.value === parentId){
				found = true
				result.push({
					...tree,
					children: addTree({
						forest: tree.children, child, childId, parentIds, parentIndex: parentIndex + 1
					})
				})
			} else {
				result.push(tree)
			}
		}

		if(!found){
			// sometimes child is added ahead of parent
			// this is normal and we should just add the parent too
			result.push({
				children: addTree({
					forest, child, childId, parentIds, parentIndex: parentIndex + 1
				}), value: parentId
			})
		}
	}
	return result
}

function deleteTree<T>({
	forest, childId, parentIds, parentIndex
}: {forest: Trees<T>, childId: UUID, parentIds: UUID[], parentIndex: number}): Trees<T> {
	const parentId = parentIds[parentIndex]
	if(!parentId){
		return trimForest(forest.map(node => {
			if(node.value !== childId || !isTreeBranch(node)){
				return node
			}
			return {...node, children: node.children.filter(child => isTreeBranch(child))}
		}))
	}

	const result: Tree<T, UUID>[] = []
	for(const tree of forest){
		if(isTreeBranch(tree) && tree.value === parentId){
			result.push({
				...tree, children: deleteTree({
					forest: tree.children, childId, parentIds, parentIndex: parentIndex + 1
				})
			})
		} else {
			result.push(tree)
		}
	}

	// at this point, it's possible to not update a single tree in the forest
	// it can be fine in case parent was deleted before child, so we don't need to raise errors
	return trimForest(result)
}

function trimForest<T>(forest: Trees<T>): Trees<T> {
	const result: Tree<T, UUID>[] = []
	for(const tree of forest){
		if(isTreeBranch(tree)){
			const children = trimForest(tree.children)
			if(children.length > 0){
				result.push({...tree, children})
			}
		} else {
			result.push(tree)
		}
	}
	return result
}

function filterForest<T>(forest: Trees<T>, filter: (value: T) => boolean): Trees<T> {
	const result: Tree<T, UUID>[] = []
	for(const tree of forest){
		if(isTreeBranch(tree)){
			const children = filterForest(tree.children, filter)
			if(children.length > 0){
				result.push({...tree, children})
			}
		} else if(filter(tree.value)){
			result.push(tree)
		}
	}
	return result
}

function sortForestByDepth<T>(forest: Trees<T>, result: T[]): void {
	const nextLevel: Tree<T, UUID>[] = []
	for(const tree of forest){
		if(isTreeBranch(tree)){
			nextLevel.push(...tree.children)
		} else {
			result.push(tree.value)
		}
	}

	if(nextLevel.length > 0){
		sortForestByDepth(nextLevel, result)
	}
}
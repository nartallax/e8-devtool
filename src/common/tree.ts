import {nonNull} from "common/non_null"

export type Tree<T, B> = TreeLeaf<T> | TreeBranch<T, B>

/** Tree path is a sequence of indices (first being root) that point to some element in tree */
export type TreePath = number[]

export function areTreePathsEqual(a: TreePath, b: TreePath): boolean {
	if(a.length !== b.length){
		return false
	}
	// we are starting comparing from the leaf
	// because a lot of tree paths will have similar starts
	// but probably not many of them will end the same even when starting the same
	// so it should help to find difference faster, on average
	for(let i = a.length - 1; i >= 0; i--){
		if(a[i] !== b[i]){
			return false
		}
	}
	return true
}

export interface TreeLeaf<T>{
	readonly value: T
}

export function isTreeLeaf<T, B>(x: Tree<T, B>): x is TreeLeaf<T> {
	return !isTreeBranch(x)
}

export interface TreeBranch<T, B>{
	readonly value: B
	readonly children: readonly Tree<T, B>[]
}

export function isTreeBranch<T, B>(x: Tree<T, B>): x is TreeBranch<T, B> {
	return "children" in x
}

export function getTreeLeaves<T, B>(tree: Tree<T, B>): IterableIterator<[readonly TreeBranch<T, B>[], T]> {
	return getTreeLeavesInternal(tree, [])
}

function* getTreeLeavesInternal<T, B>(tree: Tree<T, B>, parents: TreeBranch<T, B>[]): IterableIterator<[readonly TreeBranch<T, B>[], T]> {
	if(isTreeLeaf(tree)){
		yield[parents, tree.value]
	} else {
		parents.push(tree)
		for(const child of tree.children){
			yield* getTreeLeavesInternal(child, parents)
		}
		parents.pop()
	}
}

export function findOneLeafInTrees<T, B>(trees: readonly Tree<T, B>[], isThisIt: (value: T) => boolean): TreeLeaf<T> | undefined {
	for(const tree of trees){
		const result = findOneLeaf(tree, isThisIt)
		if(result !== undefined){
			return result
		}
	}
	return undefined
}

export function findOneLeaf<T, B>(tree: Tree<T, B>, isThisIt: (value: T) => boolean): TreeLeaf<T> | undefined {
	if(isTreeBranch(tree)){
		for(const child of tree.children){
			const result = findOneLeaf(child, isThisIt)
			if(result !== undefined){
				return result
			}
		}
	} else if(isThisIt(tree.value)){
		return tree
	}
	return undefined
}

export function filterTreeLeaves<T, B>(tree: Tree<T, B>, shouldKeepLeaf: (value: T) => boolean): Tree<T, B> | null {
	if(isTreeLeaf(tree)){
		if(!shouldKeepLeaf(tree.value)){
			return null
		}
		return tree
	}

	const newChildren = tree.children
		.map(x => filterTreeLeaves(x, shouldKeepLeaf))
		.filter(nonNull)

	return {children: newChildren, value: tree.value}
}

export function mapTreeLeaves<T, B, R>(tree: Tree<T, B>, map: (value: T) => R): Tree<R, B> {
	if(isTreeLeaf(tree)){
		return {value: map(tree.value)}
	}

	const newChildren = tree.children.map(x => mapTreeLeaves(x, map))
	return {children: newChildren, value: tree.value}
}

function resolveTreeIndicesToTrees<T, B>(trees: readonly Tree<T, B>[], indices: number[]): Tree<T, B>[] {
	const result: Tree<T, B>[] = []
	for(let i = 0; i < indices.length; i++){
		const index = indices[i]!
		const tree = trees[index]
		if(!tree){
			throw new Error(`No such index: ${index}`)
		}
		result.push(tree)
		if(i === indices.length - 1){
			return result
		}
		if(!isTreeBranch(tree)){
			throw new Error(`Failed to resolve tree by indices - ${index}th tree is not a branch`)
		}
		trees = tree.children
	}
	return result
}

export function getTreeByPath<T, B>(trees: readonly Tree<T, B>[], path: TreePath): Tree<T, B> | null {
	for(let i = 0; i < path.length; i++){
		const currentKey = path[i]!
		const nextTree = trees[currentKey]
		if(i === path.length - 1){
			return nextTree ?? null
		}
		if(!nextTree || !isTreeBranch(nextTree)){
			return null
		}
		trees = nextTree.children
	}
	return null
}

export const updateTreeByPath = <T, B>(trees: readonly Tree<T, B>[], path: TreePath, updater: (tree: Tree<T, B>) => Tree<T, B>): Tree<T, B>[] => {
	if(path.length === 0){
		throw new Error("Could not update tree by zero-length path")
	}

	const chain = resolveTreeIndicesToTrees(trees, path)

	let lastTree = chain[chain.length - 1]!
	lastTree = updater(lastTree)
	chain[chain.length - 1] = lastTree

	for(let i = chain.length - 2; i >= 0; i--){
		chain[i] = updateChildAt(chain[i] as TreeBranch<T, B>, chain[i + 1]!, path[i + 1]!)
	}
	const result = [...trees]
	result[path[0]!] = chain[0]!

	return result
}

const updateChildAt = <T, B>(parent: TreeBranch<T, B>, child: Tree<T, B>, index: number): TreeBranch<T, B> => {
	const children = [...parent.children]
	children[index] = child
	return {...parent, children}
}

export const updateBranchByPath = <T, B>(
	trees: readonly Tree<T, B>[], path: TreePath, updater: (tree: TreeBranch<T, B>) => Tree<T, B>
) => updateTreeByPath(trees, path, branch => {
	if(!isTreeBranch(branch)){
		throw new Error("Expected to have branch, but got leaf")
	}
	return updater(branch)
})

export const updateLeafByPath = <T, B>(
	trees: readonly Tree<T, B>[], path: TreePath, updater: (tree: TreeLeaf<T>) => Tree<T, B>
) => updateTreeByPath(trees, path, leaf => {
	if(isTreeBranch(leaf)){
		throw new Error("Expected to have leaf, but got branch")
	}
	return updater(leaf)
})

export const getLeafByPath = <T, B>(trees: readonly Tree<T, B>[], path: TreePath): TreeLeaf<T> => {
	const lastNode = getTreeByPath(trees, path)
	if(!lastNode){
		throw new Error("Path does not point to a tree node.")
	}
	if(isTreeBranch(lastNode)){
		throw new Error("Path points to a branch, not leaf")
	}
	return lastNode
}

export const getBranchByPath = <T, B>(trees: readonly Tree<T, B>[], path: TreePath): TreeBranch<T, B> => {
	const lastNode = getTreeByPath(trees, path)
	if(!lastNode){
		throw new Error("Path does not point to a tree node.")
	}
	if(!isTreeBranch(lastNode)){
		throw new Error("Path points to a leaf, not branch")
	}
	return lastNode
}

export const deleteFromTreeByPath = <T, B>(trees: readonly Tree<T, B>[], path: TreePath): Tree<T, B>[] => {
	if(path.length === 0){
		throw new Error("Could not delete tree by zero-length path")
	}
	const lastIndex = path[path.length - 1]!

	if(path.length === 1){
		return [...trees.slice(0, lastIndex), ...trees.slice(lastIndex + 1)]
	}

	return updateBranchByPath(trees, path.slice(0, path.length - 1), branch => {
		const children = [...branch.children.slice(0, lastIndex), ...branch.children.slice(lastIndex + 1)]
		return {...branch, children}
	})
}

export const addTreeByPath = <T, B>(trees: readonly Tree<T, B>[], newTree: Tree<T, B>, path: TreePath): Tree<T, B>[] => {
	if(path.length === 0){
		throw new Error("Could not add tree by zero-length path")
	}
	const lastIndex = path[path.length - 1]!

	if(path.length === 1){
		return [...trees.slice(0, lastIndex), newTree, ...trees.slice(lastIndex)]
	}

	return updateBranchByPath(trees, path.slice(0, path.length - 1), branch => {
		const children = [...branch.children.slice(0, lastIndex), newTree, ...branch.children.slice(lastIndex)]
		return {...branch, children}
	})
}

const updateMovePath = (from: TreePath, to: TreePath): TreePath => {
	to = [...to]
	for(let i = 0; i < Math.min(from.length, to.length); i++){
		if(from[i]! < to[i]!){
			to[i]!--
			break
		}
	}
	return to
}

export const moveTreeByPath = <T, B>(trees: readonly Tree<T, B>[], from: TreePath, to: TreePath): Tree<T, B>[] => {
	const tree = getTreeByPath(trees, from)
	if(!tree){
		throw new Error("Nothing to move")
	}

	to = updateMovePath(from, to)

	trees = deleteFromTreeByPath(trees, from)
	return addTreeByPath(trees, tree, to)
}

// TODO: move all those utils into separate file

const getSingleIndex = (path: TreePath): number => {
	if(path.length !== 1){
		throw new Error("Path length is wrong")
	}
	return path[0]!
}

// works exactly the same as moveTreeByPath, but for plain array, not for trees
// useful for cases when you have simplier data than trees, but still want to use tree infrastructure
export const moveArrayByPath = <T>(values: readonly T[], from: TreePath, to: TreePath): T[] => {
	to = updateMovePath(from, to)
	const value = values[getSingleIndex(from)]!

	let result = deleteFromArrayByPath(values, from)
	result = addToArrayByPath(values, value, to)

	return result
}

export const updateArrayByPath = <T>(values: readonly T[], path: TreePath, updater: (value: T) => T): T[] => {
	const index = getSingleIndex(path)

	const item = values[index]!
	const newItem = updater(item)
	const result = [...values]
	result[index] = newItem
	return result
}

export const deleteFromArrayByPath = <T>(values: readonly T[], path: TreePath): T[] => {
	const index = getSingleIndex(path)
	return [...values.slice(0, index), ...values.slice(index + 1)]
}

export const addToArrayByPath = <T>(values: readonly T[], newValue: T, path: TreePath): T[] => {
	const index = getSingleIndex(path)
	return [...values.slice(0, index), newValue, ...values.slice(index)]
}
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
	value: T
}

export function isTreeLeaf<T, B>(x: Tree<T, B>): x is TreeLeaf<T> {
	return !isTreeBranch(x)
}

export interface TreeBranch<T, B>{
	value: B
	children: Tree<T, B>[]
}

export function isTreeBranch<T, B>(x: Tree<T, B>): x is TreeBranch<T, B> {
	return "children" in x
}

export function getFirstTreeLeaf<T, B>(forest: Tree<T, B>[]): T | null {
	for(const tree of forest){
		for(const [, leaf] of getTreeLeaves(tree)){
			return leaf
		}
	}
	return null
}

export function getFirstTreeLeafPath<T, B>(forest: Tree<T, B>[]): TreePath | null {
	for(const tree of forest){
		for(const [trees, leafValue] of getTreeLeaves(tree)){
			const result: TreePath = []
			let parentForest = forest
			for(const tree of trees){
				const index = parentForest.indexOf(tree)
				result.push(index)
				parentForest = tree.children
			}
			const leafIndex = parentForest.findIndex(tree => tree.value === leafValue)
			result.push(leafIndex)
			return result
		}
	}
	return null
}

export const getForestLeavesAsArray = <T, B>(forest: Tree<T, B>[], result: T[] = []): T[] => {
	for(const tree of forest){
		if(isTreeBranch(tree)){
			getForestLeavesAsArray(tree.children, result)
		} else {
			result.push(tree.value)
		}
	}
	return result
}

export function getTreeLeaves<T, B>(tree: Tree<T, B>): IterableIterator<[TreeBranch<T, B>[], T]> {
	return getTreeLeavesInternal(tree, [])
}

function* getTreeLeavesInternal<T, B>(tree: Tree<T, B>, parents: TreeBranch<T, B>[]): IterableIterator<[TreeBranch<T, B>[], T]> {
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

export function findTreeNodePath<T, B>(trees: Tree<T, B>[], isThisIt: (value: T | B) => boolean): TreePath | undefined {
	for(let i = 0; i < trees.length; i++){
		const node = trees[i]!
		if(isThisIt(node.value)){
			return [i]
		}
		if(isTreeBranch(node)){
			const result = findTreeNodePath(node.children, isThisIt)
			if(result){
				return [i, ...result]
			}
		}
	}
	return undefined
}

export function findOneLeafInTrees<T, B>(trees: Tree<T, B>[], isThisIt: (value: T) => boolean): TreeLeaf<T> | undefined {
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

export function filterForestLeaves<T, B>(forest: Tree<T, B>[], shouldKeepLeaf: (value: T) => boolean): Tree<T, B>[] {
	return forest.map(tree => filterTreeLeaves(tree, shouldKeepLeaf)).filter(nonNull)
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

	return newChildren.length === 0 ? null : {children: newChildren, value: tree.value}
}

export function mapTreeLeaves<T, B, R>(tree: Tree<T, B>, map: (value: T) => R): Tree<R, B> {
	if(isTreeLeaf(tree)){
		return {value: map(tree.value)}
	}

	const newChildren = tree.children.map(x => mapTreeLeaves(x, map))
	return {children: newChildren, value: tree.value}
}

function resolveTreeIndicesToTrees<T, B>(trees: Tree<T, B>[], indices: number[]): Tree<T, B>[] {
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

export function getTreeByPath<T, B>(trees: Tree<T, B>[], path: TreePath): Tree<T, B> {
	for(let i = 0; i < path.length; i++){
		const currentKey = path[i]!
		const nextTree = trees[currentKey]
		if(i === path.length - 1){
			if(!nextTree){
				throw new Error("Path does not point to tree node.")
			}
			return nextTree
		}
		if(!nextTree || !isTreeBranch(nextTree)){
			throw new Error("Path does not point to tree node.")
		}
		trees = nextTree.children
	}
	throw new Error("Path does not point to tree node.")
}

export const updateTreeByPath = <T, B>(trees: Tree<T, B>[], path: TreePath, updater: (tree: Tree<T, B>) => Tree<T, B>): Tree<T, B>[] => {
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
	trees: Tree<T, B>[], path: TreePath, updater: (tree: TreeBranch<T, B>) => Tree<T, B>
) => updateTreeByPath(trees, path, branch => {
	if(!isTreeBranch(branch)){
		throw new Error("Expected to have branch, but got leaf")
	}
	return updater(branch)
})

export const updateLeafByPath = <T, B>(
	trees: Tree<T, B>[], path: TreePath, updater: (tree: TreeLeaf<T>) => Tree<T, B>
) => updateTreeByPath(trees, path, leaf => {
	if(isTreeBranch(leaf)){
		throw new Error("Expected to have leaf, but got branch")
	}
	return updater(leaf)
})

export const getLeafByPath = <T, B>(trees: Tree<T, B>[], path: TreePath): TreeLeaf<T> => {
	const lastNode = getTreeByPath(trees, path)
	if(isTreeBranch(lastNode)){
		throw new Error("Path points to a branch, not leaf")
	}
	return lastNode
}

export const getBranchByPath = <T, B>(trees: Tree<T, B>[], path: TreePath): TreeBranch<T, B> => {
	const lastNode = getTreeByPath(trees, path)
	if(!isTreeBranch(lastNode)){
		throw new Error("Path points to a leaf, not branch")
	}
	return lastNode
}

export const deleteFromTreeByPath = <T, B>(trees: Tree<T, B>[], path: TreePath): Tree<T, B>[] => {
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

export const addTreeByPath = <T, B>(trees: Tree<T, B>[], newTree: Tree<T, B>, path: TreePath): Tree<T, B>[] => {
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

export const moveTreeByPath = <T, B>(trees: Tree<T, B>[], from: TreePath, to: TreePath): Tree<T, B>[] => {
	const tree = getTreeByPath(trees, from)
	to = updateMovePath(from, to)

	trees = deleteFromTreeByPath(trees, from)
	return addTreeByPath(trees, tree, to)
}

export const getTreeSiblings = <T, B>(trees: Tree<T, B>[], path: TreePath): Tree<T, B>[] => {
	if(path.length === 0){
		throw new Error("Wrong path")
	}
	const parentPath = path.slice(0, path.length - 1)
	if(parentPath.length === 0){
		return trees
	}
	const parent = getTreeByPath(trees, parentPath)
	if(!isTreeBranch(parent)){
		throw new Error("Path is all wrong")
	}
	return parent.children
}

export const treeValuesToTreePath = <T, B, V>(forest: Tree<T, B>[], values: V[], treeMatches: (treeValue: T | B, arrayValue: V) => boolean): TreePath | null => {
	const parentForest = forest
	const result: TreePath = []
	outer: for(const arrayValue of values){
		let i = 0
		for(const tree of parentForest){
			if(treeMatches(tree.value, arrayValue)){
				result.push(i)
				continue outer
			}
			i++
		}
		return null
	}
	return result
}

export const treePathToValues = <T, B>(forest: Tree<T, B>[], path: TreePath): (T | B)[] => {
	const result: (T | B)[] = []
	for(let i = 0; i < path.length; i++){
		const index = path[i]!
		const tree = forest[index]
		if(!tree){
			throw new Error("Broken tree path - child index out of range")
		}
		if(i !== path.length - 1){
			if(!isTreeBranch(tree)){
				throw new Error("Expected intermediate elements of tree path to point to branches")
			}
			forest = tree.children
		}
		result.push(tree.value)
	}
	return result
}
import {Validators, ValidatorsMaybeFactory} from "client/react/components/form/validators"
import {Row} from "client/react/components/rowCol/rowCol"
import {TreeControls, TreeView, TreeViewProps} from "client/react/components/treeView/treeView"
import {AbortError} from "client/react/uiUtils/abortError"
import {Tree, TreePath, addTreeByPath, getTreeSiblings, getTreeByPath, moveTreeByPath, updateTreeByPath, isTreeBranch, deleteFromTreeByPath, TreeBranch, TreeLeaf} from "common/tree"
import {getRandomUUID} from "common/uuid"
import {NamedId} from "data/project"
import {useCallback, useMemo, useRef, useState} from "react"

type Props<L extends NamedId, B extends NamedId, T extends Tree<L, B>, S> = Pick<TreeViewProps<L, B>, "canBeChildOf" | "getLeafSublabel" | "getBranchSublabel" | "onLeafDoubleclick" > & {
	readonly values: readonly S[]
	readonly onChange: (values: readonly S[]) => void
	readonly toTree: (sourceValue: S) => T
	readonly fromTree: (tree: T) => S
	readonly onLeafDelete?: (leaf: L) => void
	readonly onBranchDelete?: (branch: B) => void
	readonly buttons?: (controls: MappedNamedIdTreeControls<L, B>) => React.ReactNode
	// rename handlers exist for cases when name is lost during mapping
	readonly onBranchRename?: (branch: B, name: string) => void
	readonly onLeafRename?: (leaf: L, name: string) => void
	// in theory nothing is stopping us from making new branches here
	// just branches could contain children, and it is unobvious how to resolve that
	// because we imply that user will need to input name, and we can't input more than one name at a time
	// (and if we only make leafs, no need to wrap it with `{value: ...}`)
	readonly makeNewChild?: () => NoNameId<L>
}

type NoNameId<T> = Omit<T, "name" | "id">

export type MappedNamedIdTreeControls<L, B> = {
	addRenameBranch: (branch: NoNameId<B>, path?: TreePath) => void
	addRenameLeaf: (leaf: NoNameId<L>, path?: TreePath) => void
}

/** A wrap around TreeView, to provide more high-level functionality */
export const MappedNamedIdTreeView = <L extends NamedId, B extends NamedId, T extends Tree<L, B>, S>({values, toTree, fromTree, onChange, canBeChildOf, onLeafDelete, onBranchDelete, onBranchRename, onLeafRename, buttons, makeNewChild, ...props}: Props<L, B, T, S>) => {
	const [newNode, setNewNode] = useState<{
		node: Tree<L, B>
		path: TreePath
	} | null>(null)

	const tree = useMemo(() => {
		let tree: Tree<L, B>[] = values.map(toTree)
		if(newNode){
			tree = addTreeByPath(tree, newNode.node, newNode.path)
		}
		return tree
	}, [values, toTree, newNode])

	const validatorFactory = useMemo(() => labelValidatorFactory(tree), [tree])

	const treeControls = useRef<TreeControls | null>(null)

	const updateByTree = (newTree: readonly Tree<L, B>[]) => {
		onChange(newTree.map(tree => fromTree(tree as T)))
	}

	const editName = (path: TreePath, name: string) => {
		const node = getTreeByPath(tree, path)
		try {
			if(isTreeBranch(node)){
				onBranchRename && onBranchRename(node.value, name)
			} else {
				onLeafRename && onLeafRename(node.value, name)
			}
		} catch(e){
			if(AbortError.isAbortError(e)){
				return
			}
			throw e
		}

		let isNew = false
		const newTree = updateTreeByPath(tree, path, node => {
			const id = node.value.id
			isNew = id === newNode?.node.value.id
			// I don't understand why do I need this cast. oh well.
			return {...node, value: {...node.value, name}} as Tree<L, B>
		})
		if(isNew){
			setNewNode(null)
		}
		updateByTree(newTree)
	}

	const cancelEditName = (path: TreePath) => {
		const node = getTreeByPath(tree, path)
		const id = node.value.id
		if(id === newNode?.node.value.id){
			setNewNode(null)
		}
	}

	const deleteNode = (path: TreePath) => {
		const node = getTreeByPath(tree, path)
		try {
			if(isTreeBranch(node)){
				if(onBranchDelete){
					onBranchDelete(node.value)
				}
			} else if(onLeafDelete){
				onLeafDelete(node.value)
			}
		} catch(e){
			if(AbortError.isAbortError(e)){
				return
			}
			throw e
		}

		updateByTree(deleteFromTreeByPath(tree, path))
	}

	const addRenameNode = useCallback((node: Tree<L, B>, path: TreePath) => {
		setNewNode({node, path})
		treeControls.current?.setInlineEditPath(path)
	}, [])

	const mappedControls: MappedNamedIdTreeControls<L, B> = {
		addRenameBranch: (branch, path = [0]) => addRenameNode({
			value: {name: "", id: getRandomUUID(), ...branch} as B,
			children: []
		}, path),
		addRenameLeaf: (leaf, path = [0]) => addRenameNode({
			value: {name: "", id: getRandomUUID(), ...leaf} as L
		}, path)
	}

	const wrappedCanBeChildOf = !canBeChildOf ? undefined : (child: Tree<L, B>, parent: TreeBranch<L, B> | null) => {
		if(!canBeChildOf(child, parent)){
			return false
		}

		const siblings = !parent ? tree : parent.children
		const haveSiblingWithSameName = siblings.some(sibling => sibling.value.id !== child.value.id && sibling.value.name === child.value.name)
		return !haveSiblingWithSameName
	}

	const onAddChild = useMemo(() => {
		if(!makeNewChild){
			return
		}
		return (path: TreePath) => {
			const value = makeNewChild()
			const node: TreeLeaf<L> = {
				value: {
					...value,
					name: "",
					id: getRandomUUID()
				} as L
			}
			addRenameNode(node, [...path, 0])
		}
	}, [makeNewChild, addRenameNode])

	return (
		<>
			{!!buttons && <Row justify="start" gap>
				{buttons(mappedControls)}
			</Row>}
			<TreeView
				{...props}
				tree={tree}
				controlRef={treeControls}
				getLeafKey={({id}) => id}
				getLeafLabel={({name}) => name}
				getBranchKey={({id}) => id}
				getBranchLabel={({name}) => name}
				leafLabelValidators={validatorFactory}
				branchLabelValidators={validatorFactory}
				canBeChildOf={wrappedCanBeChildOf}
				onDrag={!canBeChildOf ? undefined : (from, to) => updateByTree(moveTreeByPath(tree, from, to))}
				onBranchLabelEdit={editName}
				onLeafLabelEdit={editName}
				onLeafLabelEditCancel={cancelEditName}
				onBranchLabelEditCancel={cancelEditName}
				onLeafDelete={deleteNode}
				onBranchDelete={deleteNode}
				onAddChild={onAddChild}/>
		</>
	)
}

const labelValidatorFactory = <L extends NamedId, B extends NamedId>(tree: readonly Tree<L, B>[]): ValidatorsMaybeFactory<string, TreePath> => (path: TreePath) => {
	const siblings = getTreeSiblings(tree, path)
	const item = getTreeByPath(tree, path)
	return [
		Validators.nonEmpty(),
		Validators.isUnique({
			values: siblings.filter(sibling => sibling.value.id !== item.value.id).map(sibling => sibling.value.name)
		})
	]
}
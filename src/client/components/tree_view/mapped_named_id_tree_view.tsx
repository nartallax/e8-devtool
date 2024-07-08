import {Validators, ValidatorsMaybeFactory} from "client/components/form/validators"
import {Row} from "client/components/row_col/row_col"
import {SearchInput} from "client/components/text_input/search_input"
import {TreeControls, TreeView, TreeViewProps} from "client/components/tree_view/tree_view"
import {AbortError} from "client/ui_utils/abort_error"
import {Tree, TreePath, addTreeByPath, getTreeSiblings, getTreeByPath, moveTreeByPath, updateTreeByPath, isTreeBranch, deleteFromTreeByPath, TreeBranch, findTreeNodePath, filterForestLeaves, getFirstTreeLeaf, getFirstTreeLeafPath, isTreeLeaf} from "common/tree"
import {UUID, getRandomUUID} from "common/uuid"
import {useCallback, useMemo, useRef, useState} from "react"

export type NullableNamedId = {
	name: string
	// TODO: I think this doesn't need to be nullable anymore
	// it was nullable because of input group modal, but it became obsolete after transition to mapped string forests
	id: UUID | null
}

export type MappedNamedIdTreeProps<L extends NullableNamedId, B extends NullableNamedId, T extends Tree<L, B>, S> = Pick<TreeViewProps<L, B>, "canBeChildOf" | "getLeafSublabel" | "getBranchSublabel" | "onLeafClick" | "onLeafDoubleclick" | "onBranchClick" | "onBranchDoubleclick" | "InlineEditor" > & {
	values: S[]
	onChange?: (values: S[]) => void
	// TODO: in great future, when we only have named id trees everywhere, we won't be needing as much mapping as this
	// because we could then use trees directly
	toTree: (sourceValue: S, path: TreePath) => T
	fromTree?: (tree: T) => S
	// on..Delete handlers only exist for some special cases
	// for example, validations - they can throw AbortError, and it will be handled
	// simple deletion could be performed without them
	onLeafDelete?: (leaf: L, path: TreePath) => void
	onBranchDelete?: (branch: B, path: TreePath) => void
	buttons?: (controls: MappedNamedIdTreeControls) => React.ReactNode
	// rename handlers exist for cases when name is lost during mapping
	beforeBranchRename?: (branch: B, name: string, path: TreePath) => void
	beforeLeafRename?: (leaf: L, name: string, path: TreePath) => void
	// called when user finished input of leaf's name
	onLeafCreated?: (name: string, path: TreePath) => L
	onBranchCreated?: (name: string, path: TreePath) => B
	beforeLeafDragCompleted?: (oldPath: TreePath, newPath: TreePath, leaf: L) => void
	beforeBranchDragCompleted?: (oldPath: TreePath, newPath: TreePath, branch: B) => void
	selectedValue?: UUID | null
	isSearchable?: boolean
}

export type MappedNamedIdTreeControls = {
	addRenameBranch: (path?: TreePath) => void
	addRenameLeaf: (path?: TreePath) => void
}

/** A wrap around TreeView, to provide more high-level functionality */
export const MappedNamedIdTreeView = <L extends NullableNamedId, B extends NullableNamedId, T extends Tree<L, B>, S>({
	values, toTree, fromTree, onChange, canBeChildOf, onLeafDelete, onBranchDelete, beforeBranchRename, beforeLeafRename, buttons, selectedValue, isSearchable, onLeafCreated, onBranchCreated, beforeBranchDragCompleted, beforeLeafDragCompleted, ...props
}: MappedNamedIdTreeProps<L, B, T, S>) => {
	const [newNode, setNewNode] = useState<{
		node: Tree<L, B>
		path: TreePath
	} | null>(null)

	const tree = useMemo(() => {
		let tree: Tree<L, B>[] = values.map((value, i) => toTree(value, [i]))
		if(newNode){
			tree = addTreeByPath(tree, newNode.node, newNode.path)
		}
		return tree
	}, [values, toTree, newNode])

	const selectedPath = useMemo(() => {
		if(!selectedValue){
			return undefined
		}
		return findTreeNodePath(tree, value => value.id === selectedValue)
	}, [selectedValue, tree])

	const validatorFactory = useMemo(() => labelValidatorFactory(tree), [tree])

	const treeControls = useRef<TreeControls | null>(null)
	const canUpdateValues = !!onChange && !!fromTree

	const updateByTree = (newTree: Tree<L, B>[]) => {
		if(!canUpdateValues){
			throw new Error("Cannot update source values.")
		}
		onChange(newTree.map(tree => fromTree(tree as T)))
	}

	const editName = (path: TreePath, name: string) => {
		const node = getTreeByPath(tree, path)
		const isNew = node.value.id === newNode?.node.value.id

		if(!isNew){
			try {
				if(isTreeBranch(node)){
					beforeBranchRename && beforeBranchRename(node.value, name, path)
				} else {
					beforeLeafRename && beforeLeafRename(node.value, name, path)
				}
			} catch(e){
				if(AbortError.isAbortError(e)){
					return
				}
				throw e
			}
		}

		const newTree = updateTreeByPath(tree, path, node => {
			if(!isNew){
				// I don't understand why do I need this cast. oh well.
				return {...node, value: {...node.value, name}} as Tree<L, B>
			}

			if(isTreeLeaf(node)){
				if(!onLeafCreated){
					throw new Error("New leaf is at the end of creation sequence, but we don't have onLeafCreated callback.")
				}
				return node = {...node, value: onLeafCreated(name, path)}
			} else {
				if(!onBranchCreated){
					throw new Error("New branch is at the end of creation sequence, but we don't have onBranchCreated callback.")
				}
				return node = {...node, value: onBranchCreated(name, path)}
			}
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
					onBranchDelete(node.value, path)
				}
			} else if(onLeafDelete){
				onLeafDelete(node.value, path)
			}
		} catch(e){
			if(AbortError.isAbortError(e)){
				return
			}
			throw e
		}

		updateByTree(deleteFromTreeByPath(tree, path))
	}

	const addRenameNode = useCallback((node: Tree<NullableNamedId, NullableNamedId>, path: TreePath) => {
		// casting it like that is not great
		// but the tree itself won't rely on anything other than ID and name
		// and the object shouldn't ever be visible to outside world
		// so, whatever
		setNewNode({node: node as Tree<L, B>, path})
		treeControls.current?.setInlineEditPath(path)
	}, [])

	const mappedControls: MappedNamedIdTreeControls = {
		addRenameBranch: (path = [0]) => {
			if(!onBranchCreated){
				throw new Error("Cannot add a branch: onBranchCreated is not provided")
			}
			return addRenameNode({
				value: {name: "", id: getRandomUUID()},
				children: []
			}, path)
		},
		addRenameLeaf: (path = [0]) => {
			if(!onLeafCreated){
				throw new Error("Cannot add a leaf: onLeafCreated is not provided")
			}
			addRenameNode({
				value: {name: "", id: getRandomUUID()}
			}, path)
		}
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
		if(!onLeafCreated){
			return undefined
		}
		return (path: TreePath) => {
			const node = {value: {id: getRandomUUID(), name: ""} as L}
			addRenameNode(node, [...path, 0])
		}
	}, [onLeafCreated, addRenameNode])

	const [searchText, setSearchText] = useState("")
	const [filteredTree, isForceExpanded] = useMemo(() => {
		if(!searchText){
			return [tree, false]
		}
		const text = searchText.toLowerCase()

		let leafCount = 0
		const resultTree = filterForestLeaves(tree, leaf => {
			if(leaf.name.toLowerCase().indexOf(text) >= 0){
				leafCount++
				return true
			}
			return false
		})

		// if we have found more than 50 leaves - expanding will be chaos, so let's not
		// no strong theory behind this value, just something that feels right
		return [resultTree, leafCount < 50]
	}, [searchText, tree])

	const onSearchAccept = () => {
		const firstLeaf = getFirstTreeLeaf(filteredTree)
		const firstLeafPath = getFirstTreeLeafPath(filteredTree)
		if(!firstLeaf || !firstLeafPath){
			return
		}
		if(props.onLeafDoubleclick){
			props.onLeafDoubleclick(firstLeaf, firstLeafPath)
		}
	}

	const onDragCompleted = (from: TreePath, to: TreePath) => {
		const node = getTreeByPath(tree, from)
		try {
			if(isTreeBranch(node)){
				beforeBranchDragCompleted?.(from, to, node.value)
			} else {
				beforeLeafDragCompleted?.(from, to, node.value)
			}
		} catch(e){
			if(AbortError.isAbortError(e)){
				return
			}
			throw e
		}
		updateByTree(moveTreeByPath(tree, from, to))
	}

	return (
		<>
			{!!buttons && <Row justify="start" gap>
				{buttons(mappedControls)}
			</Row>}
			{!!isSearchable && <SearchInput
				onChange={setSearchText}
				inputWaitTime={250}
				isAutofocused
				onAccept={onSearchAccept}
			/>}
			<TreeView
				{...props}
				isEverythingExpanded={isForceExpanded}
				tree={filteredTree}
				controlRef={treeControls}
				getLeafKey={({id}) => id + ""}
				getLeafLabel={({name}) => name}
				getBranchKey={({id}) => id + ""}
				getBranchLabel={({name}) => name}
				leafLabelValidators={validatorFactory}
				branchLabelValidators={validatorFactory}
				canBeChildOf={wrappedCanBeChildOf}
				onDrag={!canBeChildOf || !canUpdateValues ? undefined : onDragCompleted}
				onLabelEdit={!canUpdateValues ? undefined : editName}
				onLabelEditCancel={cancelEditName}
				onDelete={!canUpdateValues ? undefined : deleteNode}
				onAddChild={!canUpdateValues ? undefined : onAddChild}
				selectedPath={selectedPath}
			/>
		</>
	)
}

const labelValidatorFactory = <L extends NullableNamedId, B extends NullableNamedId>(tree: Tree<L, B>[]): ValidatorsMaybeFactory<string, TreePath> => (path: TreePath) => {
	const siblings = getTreeSiblings(tree, path)
	const item = getTreeByPath(tree, path)
	return [
		Validators.nonEmpty(),
		Validators.isUnique({
			values: siblings.filter(sibling => sibling.value.id !== item.value.id).map(sibling => sibling.value.name)
		})
	]
}
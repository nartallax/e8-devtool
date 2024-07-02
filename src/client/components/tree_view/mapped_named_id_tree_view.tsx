import {Validators, ValidatorsMaybeFactory} from "client/components/form/validators"
import {Row} from "client/components/row_col/row_col"
import {SearchInput} from "client/components/text_input/search_input"
import {TreeControls, TreeView, TreeViewProps} from "client/components/tree_view/tree_view"
import {AbortError} from "client/ui_utils/abort_error"
import {Tree, TreePath, addTreeByPath, getTreeSiblings, getTreeByPath, moveTreeByPath, updateTreeByPath, isTreeBranch, deleteFromTreeByPath, TreeBranch, TreeLeaf, findTreeNodePath, filterForestLeaves, getFirstTreeLeaf, getFirstTreeLeafPath} from "common/tree"
import {UUID, getRandomUUID} from "common/uuid"
import {NamedId} from "data/project"
import {useCallback, useMemo, useRef, useState} from "react"

export type NullableNamedId = Omit<NamedId, "id"> & {
	id: UUID | null
}

export type MappedNamedIdTreeProps<L extends NullableNamedId, B extends NullableNamedId, T extends Tree<L, B>, S> = Pick<TreeViewProps<L, B>, "canBeChildOf" | "getLeafSublabel" | "getBranchSublabel" | "onLeafClick" | "onLeafDoubleclick" | "onBranchClick" | "onBranchDoubleclick" | "InlineEditor" > & {
	values: S[]
	onChange?: (values: S[]) => void
	toTree: (sourceValue: S) => T
	fromTree?: (tree: T) => S
	// on..Delete handlers only exist for some special cases
	// for example, validations - they can throw AbortError, and it will be handled
	// simple deletion could be performed without them
	onLeafDelete?: (leaf: L) => void
	onBranchDelete?: (branch: B) => void
	buttons?: (controls: MappedNamedIdTreeControls<L, B>) => React.ReactNode
	// rename handlers exist for cases when name is lost during mapping
	onBranchRename?: (branch: B, name: string) => void
	onLeafRename?: (leaf: L, name: string) => void
	// in theory nothing is stopping us from making new branches here
	// just branches could contain children, and it is unobvious how to resolve that
	// because we imply that user will need to input name, and we can't input more than one name at a time
	// (and if we only make leafs, no need to wrap it with `{value: ...}`)
	makeNewChild?: () => NoNameId<L>
	// called when user refuses to input name of new tree element
	onLeafCreateCancel?: (id: UUID) => void
	selectedValue?: UUID | null
	isSearchable?: boolean
}

type NoNameId<T> = Omit<T, "name" | "id">

export type MappedNamedIdTreeControls<L, B> = {
	addRenameBranch: (branch: NoNameId<B>, path?: TreePath) => void
	addRenameLeaf: (leaf: NoNameId<L>, path?: TreePath) => void
}

/** A wrap around TreeView, to provide more high-level functionality */
export const MappedNamedIdTreeView = <L extends NullableNamedId, B extends NullableNamedId, T extends Tree<L, B>, S>({
	values, toTree, fromTree, onChange, canBeChildOf, onLeafDelete, onBranchDelete, onBranchRename, onLeafRename, buttons, makeNewChild, onLeafCreateCancel, selectedValue, isSearchable, ...props
}: MappedNamedIdTreeProps<L, B, T, S>) => {
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

			if(!isTreeBranch(node) && onLeafCreateCancel && !!id){
				onLeafCreateCancel(id)
			}
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
					name: "",
					id: getRandomUUID(),
					...value
				} as L
			}
			addRenameNode(node, [...path, 0])
		}
	}, [makeNewChild, addRenameNode])

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
				onDrag={!canBeChildOf || !canUpdateValues ? undefined : (from, to) => updateByTree(moveTreeByPath(tree, from, to))}
				onBranchLabelEdit={!canUpdateValues ? undefined : editName}
				onLeafLabelEdit={!canUpdateValues ? undefined : editName}
				onLeafLabelEditCancel={cancelEditName}
				onBranchLabelEditCancel={cancelEditName}
				onLeafDelete={!canUpdateValues ? undefined : deleteNode}
				onBranchDelete={!canUpdateValues ? undefined : deleteNode}
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
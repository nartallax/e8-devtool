import {Tree, TreePath, getTreeByPath, treePathToValues, treeValuesToTreePath} from "common/tree"
import {FormInputProps, useRegisterField} from "client/components/form/form_context"
import {TextInput} from "client/components/text_input/text_input"
import {FormField} from "client/components/form/form_field"
import {useCallback, useMemo, useRef, useState} from "react"
import {Icon} from "generated/icons"
import {UUID} from "crypto"
import {Modal} from "client/components/modal/modal"
import {Form} from "client/components/form/form"
import {Col} from "client/components/row_col/row_col"
import {MappedNamedIdTreeView} from "client/components/tree_view/mapped_named_id_tree_view"
import {ModalSubmitCancelButtons} from "client/parts/modal_buttons/modal_submit_cancel_buttons"

// duplicating this type here just for sake of decoupling this component from devtool
type NamedId = {name: string, id: UUID}

type Props = FormInputProps<string> & {
	fsForest: Tree<NamedId, NamedId>[] | null
	value: string
	onChange: (newValue: string) => void
	pathSeparator?: string
	pathPrefix?: string
	isDisabled?: boolean
	placeholder?: string
	canSelectFile?: boolean
	canSelectDirectory?: boolean
}

export const PathInputField = ({
	fsForest, value, onChange, pathSeparator = "/", pathPrefix = "", canSelectDirectory, canSelectFile, isDisabled, placeholder, ...props
}: Props) => {
	const [isSelectionModalOpen, setSelectionModalOpen] = useState(false)
	const {id, hasError} = useRegisterField({value, ...props})
	const inputRef = useRef<HTMLInputElement | null>(null)

	const fsPathAsTreePath = useMemo(() => {
		if(!value.startsWith(pathPrefix) || !fsForest){
			return null
		}
		const pathParts = value.substring(pathPrefix.length).split(pathSeparator)
		return treeValuesToTreePath(fsForest, pathParts, ({name}, pathPart) => name === pathPart)
	}, [fsForest, value, pathPrefix, pathSeparator])

	const onSelectModalClose = useCallback((path?: TreePath | null) => {
		setSelectionModalOpen(false)
		if(!path || !fsForest){
			return
		}
		const result = pathPrefix + treePathToValues(fsForest, path).map(x => x.name).join(pathSeparator)
		if(inputRef.current){
			inputRef.current.value = result
		}
		onChange(result)
	}, [pathPrefix, pathSeparator, fsForest, onChange])

	return (
		<FormField id={id} onLabelClick={() => setSelectionModalOpen(true)}>
			{isSelectionModalOpen && fsForest && <PathSelectionModal
				fsForest={fsForest}
				canSelectBranch={canSelectDirectory}
				canSelectLeaf={canSelectFile}
				value={fsPathAsTreePath}
				onClose={onSelectModalClose}
			/>}
			<TextInput
				hasError={hasError}
				inputRef={inputRef}
				isDisabled={isDisabled}
				placeholder={placeholder}
				value={value}
				onChange={onChange}
				icon={!fsForest ? undefined : Icon.filesystem}
				onIconClick={() => setSelectionModalOpen(true)}
			/>
		</FormField>
	)
}


type PathSelectionModalProps = {
	value: TreePath | null
	onClose: (value?: TreePath | null) => void
	canSelectLeaf?: boolean
	canSelectBranch?: boolean
	fsForest: Tree<NamedId, NamedId>[]
}

export const PathSelectionModal = ({
	value: initialPath, onClose, fsForest, canSelectBranch, canSelectLeaf
}: PathSelectionModalProps) => {
	const [path, setPath] = useState(initialPath)
	const pathValue = useMemo(() => !path ? null : getTreeByPath(fsForest, path), [fsForest, path])

	return (
		<Modal
			header="Textures"
			contentWidth={["300px", "50vw", "600px"]}
			contentHeight={["300px", "50vh", "800px"]}
			onClose={onClose}>
			<Form onSubmit={() => onClose(path)}>
				<Col gap stretch grow>
					<MappedNamedIdTreeView
						values={fsForest}
						toTree={x => x}
						fromTree={x => x}
						selectedValue={pathValue?.value.id ?? null}
						onLeafClick={!canSelectLeaf ? undefined : (_, path) => setPath(path)}
						onLeafDoubleclick={!canSelectLeaf ? undefined : (_, path) => onClose(path)}
						onBranchClick={!canSelectBranch ? undefined : (_, path) => setPath(path)}
						onBranchDoubleclick={!canSelectBranch ? undefined : (_, path) => onClose(path)}
					/>
					<ModalSubmitCancelButtons onCancel={onClose}/>
				</Col>
			</Form>
		</Modal>
	)
}
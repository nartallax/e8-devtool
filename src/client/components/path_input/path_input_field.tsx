import {Tree, TreePath, getTreeByPath, isTreeBranch} from "common/tree"
import {FormInputProps, useRegisterField} from "client/components/form/form_context"
import {TextInput} from "client/components/text_input/text_input"
import {FormField} from "client/components/form/form_field"
import {useCallback, useRef, useState} from "react"
import {Icon} from "generated/icons"
import {Modal} from "client/components/modal/modal"
import {Form} from "client/components/form/form"
import {Col} from "client/components/row_col/row_col"
import {ModalSubmitCancelButtons} from "client/parts/modal_buttons/modal_submit_cancel_buttons"
import {StringForestView} from "client/components/tree_view/string_forest_view"

type Props = FormInputProps<string> & {
	forest: Tree<string, string>[] | null
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
	forest, value, onChange, pathSeparator = "/", pathPrefix = "", canSelectDirectory, canSelectFile, isDisabled, placeholder, ...props
}: Props) => {
	const [isSelectionModalOpen, setSelectionModalOpen] = useState(false)
	const {id, hasError} = useRegisterField({value, ...props})
	const inputRef = useRef<HTMLInputElement | null>(null)

	const onSelectModalClose = useCallback((path?: string | null) => {
		setSelectionModalOpen(false)
		if(!path || !forest){
			return
		}
		const result = pathPrefix + path
		if(inputRef.current){
			inputRef.current.value = result
		}
		onChange(result)
	}, [pathPrefix, forest, onChange])

	return (
		<FormField id={id} onLabelClick={() => setSelectionModalOpen(true)}>
			{isSelectionModalOpen && forest && <PathSelectionModal
				pathSeparator={pathSeparator}
				forest={forest}
				canSelectBranch={canSelectDirectory}
				canSelectLeaf={canSelectFile}
				value={value.substring(pathPrefix.length)}
				onClose={onSelectModalClose}
			/>}
			<TextInput
				hasError={hasError}
				inputRef={inputRef}
				isDisabled={isDisabled}
				placeholder={placeholder}
				value={value}
				onChange={onChange}
				icon={!forest ? undefined : Icon.filesystem}
				onIconClick={() => setSelectionModalOpen(true)}
			/>
		</FormField>
	)
}


type PathSelectionModalProps = {
	value: string | null
	onClose: (value?: string | null) => void
	canSelectLeaf?: boolean
	canSelectBranch?: boolean
	forest: Tree<string, string>[]
	pathSeparator: string
}

export const PathSelectionModal = ({
	value: initialPath, onClose, forest, canSelectBranch, canSelectLeaf, pathSeparator
}: PathSelectionModalProps) => {
	const [path, setPath] = useState(initialPath)

	const getOnSelect = (shouldClose: boolean) => !canSelectLeaf && !canSelectBranch ? undefined : (path: string, treePath: TreePath) => {
		const node = getTreeByPath(forest, treePath)
		const isBranch = isTreeBranch(node)
		if((isBranch && !canSelectBranch) || (!isBranch && !canSelectLeaf)){
			return
		}
		if(shouldClose){
			onClose(path)
		} else {
			setPath(path)
		}
	}

	return (
		<Modal
			header="Textures"
			contentWidth={["300px", "50vw", "600px"]}
			contentHeight={["300px", "50vh", "800px"]}
			onClose={onClose}>
			<Form onSubmit={() => onClose(path)}>
				<Col gap stretch grow>
					<StringForestView
						getObjectKey={(parts, isPrefix) => parts.join(pathSeparator) + (isPrefix ? pathSeparator : "")}
						forest={forest}
						selectedItem={path ?? null}
						canSelectBranches={canSelectBranch}
						onItemClick={getOnSelect(false)}
						onItemDoubleclick={getOnSelect(true)}
					/>
					<ModalSubmitCancelButtons onCancel={onClose}/>
				</Col>
			</Form>
		</Modal>
	)
}
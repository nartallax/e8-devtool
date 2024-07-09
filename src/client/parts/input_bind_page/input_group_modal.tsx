import {Form} from "client/components/form/form"
import {Modal} from "client/components/modal/modal"
import {Col} from "client/components/row_col/row_col"
import {StringForestView} from "client/components/tree_view/string_forest_view"
import {useInputBindsWithGroupByPath, withInputGroupForest} from "client/parts/data_providers/data_providers"
import {ModalSubmitCancelButtons} from "client/parts/modal_buttons/modal_submit_cancel_buttons"
import {useReferrersError} from "client/parts/use_referrers_error"
import {Tree, TreePath} from "common/tree"
import {getRandomUUID} from "common/uuid"
import {mergePath} from "data/project_utils"
import {useState} from "react"

type Props = {
	value: string | null
	onClose: (newValue?: string | null) => void
}

export const InputGroupModal = withInputGroupForest<Props>(
	{createItem: () => ({id: getRandomUUID()})},
	({
		value, onClose, onNodeDeleted, ...forestProps
	}) => {
		const [path, setPath] = useState(value)

		const tryShowRefsError = useReferrersError("input group", [
			useInputBindsWithGroupByPath(path)
		])

		const onDelete = async(node: Tree<string, string>, path: TreePath) => {
			await tryShowRefsError()
			await onNodeDeleted(node, path)
		}

		return (
			<Modal
				header="Input groups"
				onClose={onClose}
				contentWidth={["300px", "50vw", "600px"]}
				contentHeight={["300px", "50vh", "800px"]}>
				<Form onSubmit={() => onClose(path)}>
					<Col gap grow align="stretch">
						<StringForestView
							itemName="input group"
							makePath={mergePath}
							selectedPath={path}
							onItemClick={path => setPath(path)}
							onItemDoubleclick={path => onClose(path)}
							onNodeDeleted={onDelete}
							{...forestProps}
						/>
						<ModalSubmitCancelButtons onCancel={onClose}/>
					</Col>
				</Form>
			</Modal>
		)
	}
)
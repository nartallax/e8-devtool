import {Button} from "client/components/button/button"
import {TitlePart} from "client/components/title_context/title_context"
import {MappedNamedIdTreeControls, MappedNamedIdTreeView} from "client/components/tree_view/mapped_named_id_tree_view"
import {InputBindModal} from "client/parts/input_bind_page/input_bind_modal"
import {CentralColumn} from "client/parts/layouts/central_column"
import {useProject} from "client/parts/project_context"
import {isTreeBranch} from "common/tree"
import {getRandomUUID} from "common/uuid"
import {ProjectInputBind} from "data/project"
import {mappedForestToNameMap} from "data/project_utils"
import {Icon} from "generated/icons"
import {useState} from "react"

export const InputBindPage = () => {
	const [project, setProject] = useProject()
	const [editedBind, setEditedBind] = useState<ProjectInputBind | null>(null)
	const groupNames = mappedForestToNameMap(project.inputGroupTree, project.inputGroups)

	const onBindModalClose = (bind?: ProjectInputBind) => {
		setEditedBind(null)
		if(bind){
			setProject(project => ({
				...project,
				inputBinds: project.inputBinds.map(bindSet => {
					if(!bindSet.binds.some(oldBind => oldBind.id === bind.id)){
						return bindSet
					}
					return {
						...bindSet,
						binds: bindSet.binds.map(oldBind => oldBind.id === bind.id ? bind : oldBind)
					}
				})
			}))
		}
	}

	return (
		<TitlePart part="Inputs">
			<CentralColumn>
				{editedBind ? <InputBindModal bind={editedBind} onClose={onBindModalClose}/> : null}
				<MappedNamedIdTreeView
					values={project.inputBinds}
					onChange={inputBinds => setProject(project => ({...project, inputBinds}))}
					toTree={bindSet => ({
						value: bindSet,
						children: bindSet.binds.map(bind => ({value: bind}))
					})}
					fromTree={branch => ({
						...branch.value,
						binds: branch.children.map(node => node.value)
					})}
					canBeChildOf={(child, parent) => isTreeBranch(child) ? parent === null : parent !== null}
					getLeafSublabel={(bind: ProjectInputBind) => {
						const groupName = !bind.group ? null : groupNames.get(bind.group)
						return !groupName ? null : `(${groupName})`
					}}
					onLeafDoubleclick={bind => setEditedBind(bind)}
					onBranchCreated={name => ({name, id: getRandomUUID(), binds: []})}
					onLeafCreated={name => ({
						name, id: getRandomUUID(), defaultChords: [], group: null, isHold: false
					})}
					buttons={(controls: MappedNamedIdTreeControls) => (
						<Button
							text="Add bind set"
							icon={Icon.filePlus}
							onClick={() => controls.addRenameBranch()}
						/>
					)}
				/>
			</CentralColumn>
		</TitlePart>
	)
}
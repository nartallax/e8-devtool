import {Button} from "client/components/button/button"
import {useTitlePart} from "client/components/title_context/title_context"
import {MappedNamedIdTreeControls, MappedNamedIdTreeView} from "client/components/tree_view/mapped_named_id_tree_view"
import {InputBindModal} from "client/parts/input_bind_page/input_bind_modal"
import {CentralColumn} from "client/parts/layouts/central_column"
import {useProject} from "client/parts/project_context"
import {isTreeBranch} from "common/tree"
import {ProjectInputBind, ProjectInputBindSet} from "data/project"
import {Icon} from "generated/icons"
import {useRef, useState} from "react"

export const InputBindPage = () => {
	const [project, setProject] = useProject()
	const [editedBind, setEditedBind] = useState<ProjectInputBind | null>(null)
	const groups = new Map(project.inputGroups.map(group => [group.id, group]))
	const ref = useRef<HTMLDivElement>(null)
	useTitlePart(ref, "Inputs")

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
		<CentralColumn ref={ref}>
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
				makeNewChild={() => ({defaultChords: [], group: null, isHold: false})}
				getLeafSublabel={bind => {
					const group = !bind.group ? null : groups.get(bind.group)
					return !group ? null : `(${group.name})`
				}}
				onLeafDoubleclick={bind => setEditedBind(bind)}
				buttons={(controls: MappedNamedIdTreeControls<ProjectInputBind, ProjectInputBindSet>) => (
					<Button
						text="Add bind set"
						icon={Icon.filePlus}
						onClick={() => controls.addRenameBranch({binds: []})}
					/>
				)}
			/>
		</CentralColumn>
	)
}
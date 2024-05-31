import {Button} from "client/react/components/button/button"
import {MappedNamedIdTreeControls, MappedNamedIdTreeView} from "client/react/components/treeView/mappedNamedIdTreeView"
import {InputBindModal} from "client/react/parts/inputBindPage/inputBindModal"
import {CentralColumn} from "client/react/parts/layouts/centralColumn"
import {useProject} from "client/react/parts/projectContext"
import {isTreeBranch} from "common/tree"
import {ProjectInputBind, ProjectInputBindSet} from "data/project"
import {Icon} from "generated/icons"
import {useState} from "react"

export const InputBindPage = () => {
	const [project, setProject] = useProject()
	const [editedBind, setEditedBind] = useState<ProjectInputBind | null>(null)
	const groups = new Map(project.inputGroups.map(group => [group.id, group]))

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
				makeNewChild={() => ({defaultChords: [], group: null, isHold: false})}
				getLeafSublabel={bind => {
					const group = !bind.group ? null : groups.get(bind.group)
					return !group ? null : `(${group.name})`
				}}
				onLeafDoubleclick={bind => setEditedBind(bind)}
				buttons={(controls: MappedNamedIdTreeControls<ProjectInputBind, ProjectInputBindSet>) => (<Button
					text="Add bind set"
					icon={Icon.filePlus}
					onClick={() => controls.addRenameBranch({binds: []})}/>
				)}/>
		</CentralColumn>
	)
}
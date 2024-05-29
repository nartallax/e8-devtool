import {Button} from "client/react/components/button/button"
import {MappedNamedIdTreeControls, MappedNamedIdTreeView} from "client/react/components/treeView/mappedNamedIdTreeView"
import {CentralColumn} from "client/react/parts/layouts/centralColumn"
import {useProject} from "client/react/parts/projectContext"
import {isTreeBranch} from "common/tree"
import {ProjectInputBind, ProjectInputBindSet} from "data/project"
import {Icon} from "generated/icons"

export const InputBindPage = () => {
	const [project, setProject] = useProject()
	const groups = new Map(project.inputGroups.map(group => [group.id, group]))

	return (
		<CentralColumn>
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
				buttons={(controls: MappedNamedIdTreeControls<ProjectInputBind, ProjectInputBindSet>) => (<Button
					text="Add bind set"
					icon={Icon.filePlus}
					onClick={() => controls.addRenameBranch({binds: []})}/>
				)}/>
		</CentralColumn>
	)
}
import {Button} from "client/react/components/button/button"
import {MappedNamedIdTreeControls, MappedNamedIdTreeView} from "client/react/components/treeView/mappedNamedIdTreeView"
import {CentralColumn} from "client/react/parts/layouts/centralColumn"
import {useProject} from "client/react/parts/projectContext"
import {ProjectInputBind, ProjectInputBindSet} from "data/project"
import {Icon} from "generated/icons"

export const InputBindPage = () => {
	const [project, setProject] = useProject()

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
				buttons={(controls: MappedNamedIdTreeControls<ProjectInputBind, ProjectInputBindSet>) => (<Button
					text="Add bind set"
					icon={Icon.filePlus}
					onClick={() => controls.addRenameBranch({
						binds: []
					})}/>
				)}/>
		</CentralColumn>
	)
}
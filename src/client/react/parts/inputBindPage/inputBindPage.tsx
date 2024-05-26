import {Button} from "client/react/components/button/button"
import {Col} from "client/react/components/rowCol/rowCol"
import {MappedNamedIdTreeControls, MappedNamedIdTreeView} from "client/react/components/treeView/mappedNamedIdTreeView"
import {useProject} from "client/react/parts/projectContext"
import {ProjectInputBind, ProjectInputBindSet} from "data/project"
import {Icon} from "generated/icons"

export const InputBindPage = () => {
	const [project, setProject] = useProject()

	return (
		// TODO: refactor out this "central column" layout to separate component..?
		<Col
			width="100%"
			padding
			align="center"
			grow={1}>
			<Col
				width={["400px", "50vw", "800px"]}
				grow={1}
				align="stretch"
				gap>
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
			</Col>
		</Col>
	)
}
import {TitlePart} from "client/components/title_context/title_context"
import {MappedForestView} from "client/components/tree_view/mapped_forest_view"
import {InputBindModal} from "client/parts/input_bind_page/input_bind_modal"
import {CentralColumn} from "client/parts/layouts/central_column"
import {useProject} from "client/parts/project_context"
import {treePathToValues} from "common/tree"
import {getRandomUUID} from "common/uuid"
import {ProjectInputBind} from "data/project"
import {mappedForestToNameMap, treePartsToPath} from "data/project_utils"
import {useState} from "react"

export const InputBindPage = () => {
	const [project, setProject] = useProject()
	const [editedBind, setEditedBind] = useState<{bind: ProjectInputBind, path: string[]} | null>(null)
	const groupNames = mappedForestToNameMap(project.inputGroupTree, project.inputGroups)

	const onBindModalClose = (bind?: ProjectInputBind, path?: string[]) => {
		setEditedBind(null)
		if(bind && path){
			setProject(project => ({
				...project,
				inputBinds: {
					...project.inputBinds,
					[treePartsToPath(path)]: bind
				}
			}))
		}
	}

	return (
		<TitlePart part="Inputs">
			<CentralColumn>
				{editedBind ? <InputBindModal bind={editedBind.bind} path={editedBind.path} onClose={onBindModalClose}/> : null}
				<MappedForestView
					getObjectKey={treePartsToPath}
					itemName="bind"
					createItem={(): ProjectInputBind => ({
						id: getRandomUUID(), defaultChords: [], group: null, isHold: false
					})}
					forest={project.inputBindTree}
					setForest={inputBindTree => setProject(project => ({...project, inputBindTree}))}
					map={project.inputBinds}
					setMap={inputBinds => setProject(project => ({...project, inputBinds}))}
					getItemSublabel={(bind: ProjectInputBind) => {
						const groupName = !bind.group ? null : groupNames.get(bind.group)
						return !groupName ? null : `(${groupName})`
					}}
					onItemDoubleclick={(bind, path) => setEditedBind({bind, path: treePathToValues(project.inputBindTree, path)})}
				/>
			</CentralColumn>
		</TitlePart>
	)
}
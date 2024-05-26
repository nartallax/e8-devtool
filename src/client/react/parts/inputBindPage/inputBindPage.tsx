import {chordToString} from "@nartallax/e8"
import {Button} from "client/react/components/button/button"
import {Col, Row} from "client/react/components/rowCol/rowCol"
import {TreeControls, TreeView} from "client/react/components/treeView/treeView"
import {useProject} from "client/react/parts/projectContext"
import {Tree, TreePath, deleteFromArrayByPath, updateArrayByPath} from "common/tree"
import {UUID, getRandomUUID} from "common/uuid"
import {InputGroup, Project, ProjectInputBind, ProjectInputBindSet} from "data/project"
import {Icon} from "generated/icons"
import {useMemo, useRef} from "react"

export const InputBindPage = () => {
	const [project, setProject] = useProject()
	const binds = project.inputBinds
	const bindTree: Tree<ProjectInputBind, ProjectInputBindSet>[] = useMemo(() =>
		binds.map(bindSet => ({
			value: bindSet,
			children: bindSet.binds.map(bind => ({
				value: bind
			}))
		})), [binds])
	const treeControls = useRef<TreeControls | null>(null)

	// TODO: think about refactoring this approach into some sort of hook, or component
	// I really should not have to repeat this every time, it's getting ridiculous
	const freshlyAddedBindSetId = useRef<UUID | null>(null)

	const addBindSet = () => {
		const bindSet: ProjectInputBindSet = {
			id: getRandomUUID(),
			name: "",
			binds: []
		}
		setProject(project => ({
			...project,
			inputBinds: [bindSet, ...project.inputBinds]
		}))
		freshlyAddedBindSetId.current = bindSet.id

		treeControls?.current?.setInlineEditPath?.([0])
	}

	const deleteBindSet = (path: TreePath) => setProject(project => ({
		...project,
		inputBinds: deleteFromArrayByPath(project.inputBinds, path)
	}))

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
				<Row justify="start" gap>
					<Button text="Add bind set" icon={Icon.filePlus} onClick={addBindSet}/>
				</Row>
				<TreeView
					controlRef={treeControls}
					tree={bindTree}
					getLeafKey={({id}) => id}
					getBranchKey={({id}) => id}
					getLeafLabel={({name}) => name}
					getLeafSublabel={bind => getBindSublabel(bind, project.inputGroups)}
					getBranchLabel={({name}) => name}
					onBranchLabelEditCancel={path => {
						if(project.inputBinds[path[0]!]!.id === freshlyAddedBindSetId.current){
							deleteBindSet(path)
						}
					}}
					onBranchLabelEdit={(path, name) => {
						setProject(project => ({
							...project,
							inputBinds: updateArrayByPath(project.inputBinds, path, bindSet => ({
								...bindSet,
								name
							}))
						}))
						freshlyAddedBindSetId.current = null
					}}
					onBranchDelete={deleteBindSet}
					onLeafLabelEdit={(path, name) => setProject(project =>
						updateBind(project, path, bind => ({...bind, name}))
					)}
					onLeafDelete={path => setProject(project =>
						updateBindSet(project, path, bindSet => ({
							...bindSet,
							binds: deleteFromArrayByPath(bindSet.binds, path.slice(1))
						}))
					)}/>
			</Col>
		</Col>
	)

}

const updateBindSet = (project: Project, path: TreePath, updater: (bindSet: ProjectInputBindSet) => ProjectInputBindSet) => {
	const bindSetIndex = path[0]!
	const bindSets = [...project.inputBinds]
	bindSets[bindSetIndex] = updater(bindSets[bindSetIndex]!)
	return {...project, inputBinds: bindSets}
}

const updateBind = (project: Project, path: TreePath, updater: (bindSet: ProjectInputBind) => ProjectInputBind) => {
	return updateBindSet(project, path, bindSet => {
		const bindIndex = path[1]!
		const binds = [...bindSet.binds]
		const bind = bindSet.binds[bindIndex]!
		binds[bindIndex] = updater(bind)
		return {...bindSet, binds}
	})
}


const getBindSublabel = (bind: ProjectInputBind, inputGroups: readonly InputGroup[]) => {
	const chords = bind.defaultChords

	let chordsStr: string
	if(chords.length === 0){
		chordsStr = "no default"
	} else {
		const chord = chords[0]!
		chordsStr = chordToString(chord)
		if(chords.length > 1){
			chordsStr += ` and ${chords.length - 1} more`
		}
	}

	let groupStr = ""
	if(bind.group !== null){
		const group = inputGroups.find(group => group.id === bind.group)
		groupStr = (group?.name ?? "<broken group>") + "; "
	}

	return `(${groupStr}${chordsStr})`
}
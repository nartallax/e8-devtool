import {Forest, ForestPath, Tree, isTreeBranch} from "@nartallax/forest"
import {useAlert} from "client/components/modal/alert_modal"
import {useApiClient} from "client/parts/api_context"
import {AbortError} from "client/ui_utils/abort_error"
import {useQuery} from "client/ui_utils/cacheable_query"
import {ProjectObjectType, emptyProjectObjectMakers, getProjectObjectTypeByFilename} from "data/project_object_types"
import {ProjectObjectReferrer} from "data/project_referrers"
import {replaceLastPathPart, treePathToString} from "data/project_utils"
import {useMemo} from "react"

const comparator = (a: Tree<string, string>, b: Tree<string, string>) => a.value < b.value ? -1 : 1

export const useFsForest = () => {
	const api = useApiClient()
	const [trees, setTrees, {isLoaded}] = useQuery<readonly Tree<string, string>[]>({
		keys: ["fsForest"],
		default: [],
		fetch: () => api.fsBindings.getForest()
	})

	const {showAlert} = useAlert()
	const forest = useMemo(() => new Forest(trees), [trees])

	const createNode = async(node: Tree<string, string>, path: ForestPath, type: ProjectObjectType) => {
		const pathStr = treePathToString(forest, path.slice(0, -1), node.value)
		if(!isTreeBranch(node)){
			const item = emptyProjectObjectMakers[type]()
			await api.fsBindings.create(pathStr, item)
		} else {
			await api.fsBindings.createDirectory(pathStr)
		}
		setTrees(forest.insertTreeAt(path, node, comparator).trees)
	}

	const moveNode = async(node: Tree<string, string>, fromPath: ForestPath, toPath: ForestPath) => {
		await api.fsBindings.move(
			treePathToString(forest, fromPath),
			treePathToString(forest, toPath.slice(0, -1), node.value)
		)
		setTrees(forest.move(fromPath, toPath, comparator).trees)
	}

	const renameNode = async(node: Tree<string, string>, path: ForestPath, newName: string) => {
		void node // we don't actually need node here, it's here for sake of regularity of handler arguments
		const oldPath = treePathToString(forest, path)
		const newPath = replaceLastPathPart(oldPath, newName)
		await api.fsBindings.move(oldPath, newPath)
		setTrees(forest.updateTreeAt(path, tree => ({...tree, value: newName}), comparator).trees)
	}

	const showRefErrors = async(refs: ProjectObjectReferrer[], itemType: ProjectObjectType) => {
		if(refs.length === 0){
			return
		}

		const firstRefs = refs.slice(0, 10)
		let message = `This ${itemType} is being referred to from other objects: `
		message += "\n\t" + firstRefs.map(({type, path}) => `${type}: ${path}`).join("\n\t")
		if(firstRefs.length < refs.length){
			message += `\n...and ${refs.length - firstRefs.length} more.`
		}
		message += `\nYou should remove those references first, and then delete this ${itemType}.`

		await showAlert({header: `This ${itemType} is in use`, body: message})
		throw new AbortError(`Deletion prevented, ${itemType} is used from ${refs.length} objects.`)
	}

	const deleteNode = async(node: Tree<string, string>, path: ForestPath) => {
		const pathStr = treePathToString(forest, path)
		const itemType = getProjectObjectTypeByFilename(pathStr)
		if(!isTreeBranch(node) && !!itemType){
			const refs = await api.getObjectReferrers(pathStr)
			await showRefErrors(refs, itemType)
		}
		await api.fsBindings.delete(pathStr)
		setTrees(forest.deleteAt(path).trees)
	}

	return {
		isLoaded,
		forest,
		createNode,
		moveNode,
		renameNode,
		deleteNode
	}
}
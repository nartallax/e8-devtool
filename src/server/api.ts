import {DevtoolActions} from "server/actions"
import {DirectoryController} from "server/tree_fs/directory_controller"

export const getApi = (actions: DevtoolActions): Record<string, (...args: any[]) => unknown> => {

	const generateResourcePack = async(): Promise<void> => {
		await actions.produceEverything()
	}

	const api: Record<string, (...args: any[]) => unknown> = {
		getProjectConfig: actions.getProjectConfig,
		updateProjectConfig: actions.updateProjectConfig,
		getObjectReferrers: actions.getObjectReferrers,
		generateResourcePack
	}

	const addDirToApi = (dir: DirectoryController, prefix: string) => {
		api[`${prefix}/create`] = dir.createItem.bind(dir)
		api[`${prefix}/update`] = dir.updateItem.bind(dir)
		api[`${prefix}/createDirectory`] = dir.createDirectory.bind(dir)
		api[`${prefix}/move`] = dir.moveNode.bind(dir)
		api[`${prefix}/delete`] = dir.deleteNode.bind(dir)
		api[`${prefix}/get`] = dir.getItemByPath.bind(dir)
		api[`${prefix}/getForest`] = dir.getTrees.bind(dir)
	}

	addDirToApi(actions.projectDirectoryController, "fs")

	return api
}
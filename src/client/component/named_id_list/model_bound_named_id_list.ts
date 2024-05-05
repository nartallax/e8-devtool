import {capitalize} from "common/capitalize"
import {pluralize} from "common/pluralize"
import {UUID} from "common/uuid"
import {askUserForConfirmation} from "client/component/modal/ask_user_for_confirmation"
import {NamedIdList, NamedIdListProps} from "client/component/named_id_list/named_id_list"
import {project} from "client/client_globals"
import {NamedId, Project, ProjectEntity} from "data/project"

export interface ModelBoundNamedIdListProps<T extends NamedId> extends Omit<NamedIdListProps<T>, "canDelete" | "beforeDelete"> {
	readonly modelHasId: (model: ProjectEntity, id: UUID) => boolean
	readonly setModelId: (model: ProjectEntity, id: UUID) => ProjectEntity
	readonly getSubstituteList: (project: Project) => readonly NamedId[]
	readonly onDelete?: (id: UUID) => void
	readonly canDelete?: NamedIdListProps<T>["canDelete"]
}

export function ModelBoundNamedIdList<T extends NamedId>(props: ModelBoundNamedIdListProps<T>) {
	return NamedIdList({
		...props,
		canDelete: async item => {
			if(props.canDelete && !(await props.canDelete(item))){
				return false
			}

			const modelsWithId = project.get().models
				.filter(model => props.modelHasId(model, item.id))
			if(modelsWithId.length === 0){
				return true
			}

			const itemList = props.getSubstituteList(project.get())
			const nextItem = findSubstituteItem(itemList, item)
			const modelsWord = pluralize("model", modelsWithId.length)
			return await askUserForConfirmation({
				title: capitalize(props.itemName) + " in use",
				text: `${capitalize(props.itemName)} ${item.name} is still in use in ${modelsWithId.length} ${modelsWord} (${modelsWithId[0]!.name}${modelsWithId.length === 1 ? "" : "and others"}). In ${modelsWithId.length === 1 ? "this" : "those"} ${modelsWord}, ${props.itemName} will be changed to ${nextItem.name}. Should we proceed with deletion?`
			})
		},
		beforeDelete: item => {
			const itemList = props.getSubstituteList(project.get())
			const nextItem = findSubstituteItem(itemList, item)
			massUpdateModels(
				model => props.modelHasId(model, item.id),
				model => props.setModelId(model, nextItem.id)
			)
			props.onDelete && props.onDelete(item.id)
		}
	})
}

function findSubstituteItem(items: readonly NamedId[], target: NamedId): NamedId {
	const index = items.findIndex(item => item.id === target.id)
	if(index < 0){
		throw new Error("Item is not in the array")
	}
	if(index > 0){
		return items[index - 1]!
	}
	if(index === items.length - 1){
		throw new Error("Cannot find substitute item if there's only one item")
	}
	return items[index + 1]!
}

function massUpdateModels(shouldUpdate: (model: ProjectEntity) => boolean, update: (model: ProjectEntity) => ProjectEntity): void {
	let _project = project.get()
	const models = _project.models
	let updateCount = 0
	const newModels = models.map(model => {
		if(shouldUpdate(model)){
			updateCount++
			return update(model)
		} else {
			return model
		}
	})
	if(updateCount === 0){
		return
	}
	_project = {..._project, models: newModels}
	project.set(_project)
}
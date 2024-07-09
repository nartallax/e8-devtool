import {useAlert} from "client/components/modal/alert_modal"
import {ProjectObjectReferrer} from "client/parts/data_providers/data_resolvers"
import {AbortError} from "client/ui_utils/abort_error"

export const useReferrersError = (valueName: string, refs: Promise<ProjectObjectReferrer[]>[]): () => Promise<void> => {
	const {showAlert} = useAlert()

	return async() => {
		const resolvedRefs = (await Promise.all(refs)).flat()
		if(resolvedRefs.length < 0){
			return
		}


		const firstRefs = resolvedRefs.slice(0, 10)
		let message = `This ${valueName} is being referred to from other objects: `
		message += "\n\t" + firstRefs.map(({type, path}) => `${type}: ${path}`).join("\n\t")
		if(firstRefs.length < resolvedRefs.length){
			message += `\n...and ${resolvedRefs.length - firstRefs.length} more.`
		}
		message += `\nYou should remove those references first, and then delete this ${valueName}.`

		await showAlert({header: `This ${valueName} is in use`, body: message})
		throw new AbortError(`Deletion prevented, ${valueName} is used from ${resolvedRefs.length} objects.`)
	}
}
import {defineContext} from "client/ui_utils/define_context"
import {UUID, getRandomUUID} from "common/uuid"
import {Icon} from "generated/icons"
import {useCallback, useState} from "react"

type Toast = Omit<AddToastArgs, "id"> & {
	id: UUID
	ttlHandler: ReturnType<typeof setTimeout> | null
}

type AddToastArgs = {
	id?: UUID
	text: string
	icon?: Icon
	ttl?: number
	isStepRotating?: boolean
}

type UpdateToastArgs = Omit<AddToastArgs, "id" | "text"> & {id: UUID, text?: string}

const updateToasts = (activeToasts: Toast[], args: UpdateToastArgs, removeToast: (id: UUID) => void): Toast[] => {
	let toast = activeToasts.find(toast => toast.id === args.id)
	if(!toast){
		// it's probably already removed...?
		return activeToasts
	}

	if(toast.ttlHandler){
		clearTimeout(toast.ttlHandler)
	}

	if(args.ttl){
		toast.ttlHandler = setTimeout(() => removeToast(args.id), args.ttl)
	}

	toast = {
		...toast,
		...args
	}

	return activeToasts.map(oldToast => oldToast.id === toast.id ? toast : oldToast)
}

export const [ToastProvider, useToastContext] = defineContext({
	name: "ToastContext",
	useValue: () => {
		const [activeToasts, setActiveToasts] = useState<Toast[]>([])

		const removeToast = useCallback((id: UUID) => {
			setActiveToasts(toasts => toasts.filter(toast => toast.id !== id))
		}, [])

		const updateToast = useCallback((args: UpdateToastArgs) => {
			setActiveToasts(activeToasts => updateToasts(activeToasts, args, removeToast))
		}, [removeToast])

		const addToast = useCallback((args: AddToastArgs): UUID => {
			const id = args.id ?? getRandomUUID()

			setActiveToasts(activeToasts => {
				const existingToast = activeToasts.find(toast => toast.id === id)
				if(existingToast){
					return updateToasts(activeToasts, {...args, id}, removeToast)
				}
				return [{
					...args,
					id,
					ttlHandler: args.ttl !== undefined ? setTimeout(() => removeToast(id), args.ttl) : null
				}, ...activeToasts]
			})

			return id
		}, [removeToast])

		return {activeToasts, addToast, updateToast, removeToast}
	}
})
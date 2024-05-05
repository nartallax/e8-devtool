import {MRBox, constBoxWrap, unbox} from "@nartallax/cardboard"
import {Icon} from "generated/icons"
import * as css from "./toast.module.scss"
import {tag} from "@nartallax/cardboard-dom"
import {Spinner} from "client/component/spinner/spinner"

interface ToastDescription {
	readonly icon?: MRBox<Icon>
	readonly text: MRBox<string>
	readonly autoRemoveTimeMs?: number
	readonly preventClickRemove?: MRBox<boolean>
	readonly onRemove?: () => void
}

export interface Toast {
	remove(): void
	/** Reset autoremove timer */
	renew(): void
}

interface ToastInternal extends Toast {
	element: HTMLElement | null
	wasRemoved: boolean
	removeTimeout: ReturnType<typeof setTimeout> | null
}

let container: HTMLElement | null = null
let toastCount = 0
const incrementToastCount = (): HTMLElement => {
	toastCount++
	if(!container){
		container = tag({class: css.toastContainer})
	}
	document.body.append(container)
	return container
}
const decrementToastCount = () => {
	toastCount--
	if(toastCount === 0){
		setTimeout(() => {
			if(toastCount === 0 && container){
				container.remove()
				container = null
			}
		}, 250)
	}
}

const maxToastCount = 5
let unshownToastsStack: {desc: ToastDescription, toast: ToastInternal}[] = []

const tryShowNextToast = () => {
	if(toastCount >= maxToastCount){
		return
	}

	const pair = unshownToastsStack[0]
	if(!pair){
		return
	}
	unshownToastsStack = unshownToastsStack.slice(1)

	const {desc, toast} = pair
	actuallyShowToast(desc, toast)

}

const actuallyShowToast = (desc: ToastDescription, toast: ToastInternal) => {
	const toastContent = tag({
		class: css.toast,
		onClick: () => {
			if(!unbox(desc.preventClickRemove)){
				toast.remove()
			}
		}
	}, [
		constBoxWrap(desc.icon).map(icon => icon === Icon.spinner ? Spinner() : tag({class: icon})),
		tag({class: [
			css.toastText,
			{[css.preventClickRemove!]: desc.preventClickRemove}
		]}, [desc.text])
	])

	toast.element = tag({
		class: [css.toastWrap, css.hidden]
	}, [
		tag({
			class: css.toastWrapInner
		}, [toastContent])
	])

	toast.renew()

	const container = incrementToastCount()
	container.append(toast.element)
	requestAnimationFrame(() => {
		if(toast.element){
			toast.element.classList.remove(css.hidden!)
		}
	})
}

export function showToast(desc: ToastDescription): Toast {
	const toast: ToastInternal = {
		element: null,
		wasRemoved: false,
		removeTimeout: null,
		renew: () => {
			if(toast.removeTimeout){
				clearTimeout(toast.removeTimeout)
				toast.removeTimeout = null
			}

			if(desc.autoRemoveTimeMs !== undefined){
				toast.removeTimeout = setTimeout(() => {
					toast.remove()
				}, desc.autoRemoveTimeMs)
			}
		},
		remove: () => {
			if(toast.wasRemoved){
				return
			}
			toast.wasRemoved = true

			if(toast.element){
				const el = toast.element
				el.classList.add(css.hidden!)
				setTimeout(() => {
					el.remove()
				}, 250)
				toast.element = null
				decrementToastCount()
				tryShowNextToast()
			} else {
				unshownToastsStack = unshownToastsStack.filter(x => x.toast !== toast)
			}

			if(desc.onRemove){
				desc.onRemove()
			}
		}
	}

	unshownToastsStack.push({desc, toast})
	tryShowNextToast()

	return toast
}
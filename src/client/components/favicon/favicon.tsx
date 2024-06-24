import {useEffect, useMemo} from "react"

type Props = {
	src: string
}

export const Favicon = ({src}: Props) => {
	const el = useMemo(() => {
		let el: HTMLLinkElement | null = document.head.querySelector("link[rel='icon']")
		if(!el){
			el = document.createElement("link")
			el.setAttribute("rel", "icon")
			document.head.appendChild(el)
		}
		return el
	}, [])

	useEffect(() => {
		el.href = src
	}, [el, src])

	return null
}
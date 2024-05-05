import {MRBox, calcBox} from "@nartallax/cardboard"
import {urlBox} from "@nartallax/cardboard-dom"
import {Container, ContainerProps} from "client/component/row_col/row_col"
import {SwapContainer} from "client/component/swap_container/swap_container"

interface Props extends ContainerProps {
	readonly basePath?: string
	readonly routes: MRBox<Readonly<Record<string, () => HTMLElement>>>
}

export const Router = (props: Props) => {
	const root = Container(props)

	const pathBox = urlBox(root, {path: true})

	const basePath = props.basePath ?? ""
	const contentBox = calcBox([pathBox, props.routes], (path, routes) => {
		if(!path.startsWith(basePath)){
			return null
		}
		path = path.substring(basePath.length)
		const renderer = routes[path]
		if(!renderer){
			return null
		} else {
			return renderer()
		}
	})

	root.append(SwapContainer({...props, content: contentBox}))

	return root
}
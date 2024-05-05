import {box} from "@nartallax/cardboard"
import {bindBox, tag} from "@nartallax/cardboard-dom"
import {Api} from "client/api_client"
import {project} from "client/client_globals"
import {Col} from "client/component/row_col/row_col"
import {Spinner} from "client/component/spinner/spinner"
import {Workbench} from "client/component/workbench/workbench"
import * as css from "./atlas_page.module.scss"
import {SvgTextureFile, getAtlasSideLength} from "data/project_to_resourcepack/atlas_building_utils"
import {XY} from "@nartallax/e8"

export const AtlasPage = () => {
	const atlasLayout = box<(SvgTextureFile & XY)[] | null>(null)

	const page = Col({grow: 1, align: "stretch"}, [
		atlasLayout.map(layout => {
			if(!layout){
				return Spinner({size: "big"})
			}

			const sideLength = getAtlasSideLength(layout)

			return Workbench({
				grow: 1,
				height: sideLength,
				width: sideLength,
				zoom: {
					speed: 0.25,
					min: 0.1,
					max: 10,
					default: 1
				},
				content: () => {
					return tag({
						class: css.atlasElementContainer,
						style: {
							width: sideLength + "px",
							height: sideLength + "px"
						}
					}, layout.map(el => {
						const elTag = tag({
							class: css.atlasElement,
							style: {
								width: el.width + "px",
								height: el.height + "px",
								top: el.y + "px",
								left: el.x + "px"
							}
						})
						elTag.innerHTML = el.svg // ew. but is there a better way?
						return elTag
					}))
				}
			})
		})
	])

	bindBox(page, project, async project => {
		atlasLayout.set(null)
		const layout = await Api.projectToAtlasLayout(project)
		atlasLayout.set(layout)
	})

	return page
}
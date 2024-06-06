import {XY} from "@nartallax/e8"
import {Workbench} from "client/react/components/workbench/workbench"
import {useApi} from "client/react/parts/apiContext"
import {useProject} from "client/react/parts/projectContext"
import {SvgTextureFile, getAtlasSideLength} from "data/project_to_resourcepack/atlas_building_utils"
import * as css from "./atlasPage.module.scss"

export const AtlasPage = () => {
	const [project] = useProject()
	const [atlasEntries] = useApi<(SvgTextureFile & XY)[]>(api => api.projectToAtlasLayout(project), [project])
	const sideLength = getAtlasSideLength(atlasEntries ?? [])
	return (
		<Workbench width={1000} height={100}>
			<div className={css.atlasElementContainer} style={{width: sideLength + "px", height: sideLength + "px"}}>
				{(atlasEntries ?? []).map((entry, i) => (<div
					className={css.atlasElement}
					key={i}
					style={{
						width: entry.width + "px",
						height: entry.height + "px",
						top: entry.y + "px",
						left: entry.x + "px"
					}}
					// eslint-disable-next-line react/no-danger
					dangerouslySetInnerHTML={{__html: entry.svg}}/>))}
			</div>
		</Workbench>
	)
}
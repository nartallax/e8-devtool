import {XY} from "@nartallax/e8"
import {Workbench} from "client/components/workbench/workbench"
import {useApi} from "client/parts/api_context"
import {useProject} from "client/parts/project_context"
import {SvgTextureFile, getAtlasSideLength} from "data/project_to_resourcepack/atlas_building_utils"
import * as css from "./atlas_page.module.scss"

// TODO: not only here, but I don't like our naming scheme
// let's bind it to file contents; like AtlasPage.tsx
// but I also don't like pascal case in file names T_T
export const AtlasPage = () => {
	const [project] = useProject()
	const [atlasEntries] = useApi<(SvgTextureFile & XY)[]>(api => api.projectToAtlasLayout(project), [project])
	const sideLength = getAtlasSideLength(atlasEntries ?? [])
	return (
		<Workbench width={sideLength} height={sideLength}>
			<div className={css.atlasElementContainer} style={{width: sideLength + "px", height: sideLength + "px"}}>
				{(atlasEntries ?? []).map((entry, i) => (
					<div
						className={css.atlasElement}
						key={i}
						style={{
							width: entry.width + "px",
							height: entry.height + "px",
							top: entry.y + "px",
							left: entry.x + "px"
						}}
						// eslint-disable-next-line react/no-danger
						dangerouslySetInnerHTML={{__html: entry.svg}}
					/>
				))}
			</div>
		</Workbench>
	)
}
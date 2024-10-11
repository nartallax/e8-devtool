import {Workbench} from "client/components/workbench/workbench"
import {useApi} from "client/parts/api_context"
import {getAtlasSideLength} from "data/project_to_resourcepack/atlas_building_utils"
import * as css from "./atlas_page.module.scss"
import {TitlePart} from "client/components/title_context/title_context"

export const AtlasPage = () => {
	const [atlasEntries] = useApi(api => api.getAtlasLayout(), [])
	const sideLength = getAtlasSideLength(atlasEntries ?? [])

	return (
		<TitlePart part="Atlas">
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
		</TitlePart>
	)
}
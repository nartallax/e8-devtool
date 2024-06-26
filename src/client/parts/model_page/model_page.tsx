import {Router} from "client/components/router/router"
import {TitlePart} from "client/components/title_context/title_context"
import {ModelDisplay} from "client/parts/model_page/model_display/model_display"
import {ModelSelector} from "client/parts/model_page/model_selector"
import {UUID} from "common/uuid"

export const ModelPage = () => {

	return (
		<TitlePart part="Models">
			<Router
				routes={[
					["/:modelId", ({modelId}) => <ModelDisplay modelId={modelId as UUID}/>],
					["/", () => <ModelSelector/>]
				]}
			/>
		</TitlePart>
	)
}
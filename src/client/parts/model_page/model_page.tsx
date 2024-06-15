import {Router} from "client/components/router/router"
import {ModelDisplay} from "client/parts/model_page/model_display/model_display"
import {ModelSelector} from "client/parts/model_page/model_selector"
import {UUID} from "common/uuid"

export const ModelPage = () => {
	return (
		<Router routes={[
			["/:modelId", ({modelId}) => <ModelDisplay modelId={modelId as UUID}/>],
			["/", () => <ModelSelector/>]
		]}
		/>
	)
}
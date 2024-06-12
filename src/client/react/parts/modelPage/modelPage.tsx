import {Router} from "client/react/components/router/router"
import {ModelDisplay} from "client/react/parts/modelPage/modelDisplay"
import {ModelSelector} from "client/react/parts/modelPage/modelSelector"
import {UUID} from "common/uuid"

export const ModelPage = () => {
	return (
		<Router routes={[
			["/:modelId", ({modelId}) => <ModelDisplay modelId={modelId as UUID}/>],
			["/", () => <ModelSelector/>]
		]}/>
	)
}
import {Router} from "client/react/components/router/router"
import {ModelSelector} from "client/react/parts/modelPage/modelSelector"

export const ModelPage = () => {
	return (
		<Router routes={[
			["/:modelId", ({modelId}) => {
				console.log(modelId)
				return modelId
			}],
			["/", () => <ModelSelector/>]
		]}/>
	)
}
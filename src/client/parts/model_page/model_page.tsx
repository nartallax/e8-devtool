import {Router} from "client/components/router/router"
import {useTitlePart} from "client/components/title_context/title_context"
import {ModelDisplay} from "client/parts/model_page/model_display/model_display"
import {ModelSelector} from "client/parts/model_page/model_selector"
import {UUID} from "common/uuid"
import {useRef} from "react"

export const ModelPage = () => {
	const ref = useRef<HTMLDivElement>(null)
	useTitlePart(ref, "Models")

	return (
		<Router
			ref={ref}
			routes={[
				["/:modelId", ({modelId}) => <ModelDisplay modelId={modelId as UUID}/>],
				["/", () => <ModelSelector/>]
			]}
		/>
	)
}
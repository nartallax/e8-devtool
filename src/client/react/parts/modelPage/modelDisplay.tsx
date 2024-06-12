import {Workbench} from "client/react/components/workbench/workbench"
import {useConfig} from "client/react/parts/configContext"
import {ModelDisplayContextProvider} from "client/react/parts/modelPage/modelDisplayContext"
import {ModelShapeLayer} from "client/react/parts/modelPage/modelShapesLayer"
import {ModelTextureLayer} from "client/react/parts/modelPage/modelTextureLayer"
import {useProject, useProjectContext} from "client/react/parts/projectContext"
import {UUID} from "common/uuid"

type Props = {
	readonly modelId: UUID
}

export const ModelDisplay = ({modelId}: Props) => {
	const {isLoaded} = useProjectContext()

	return (
		!isLoaded ? null : <ModelWorkbench modelId={modelId}/>
	)
}

const ModelWorkbench = ({modelId}: Props) => {
	const [project] = useProject()
	const {inworldUnitPixelSize} = useConfig()

	const model = project.models.find(model => model.id === modelId)
	if(!model){
		throw new Error("No model for ID = " + modelId)
	}

	// tbh I don't exactly remember what it is and why can't we just use inworldUnitPixelSize
	// TODO: investigate
	const sizeMultiplier = Math.max(1000, inworldUnitPixelSize * 10)

	return (
		<Workbench
			width={model.size.x * sizeMultiplier}
			height={model.size.y * sizeMultiplier}
			maxZoom={10}
			minZoom={0.1}
			initialZoom={0.25}>
			<ModelDisplayContextProvider model={model} sizeMultiplier={sizeMultiplier}>
				<ModelTextureLayer/>
				<ModelShapeLayer/>
			</ModelDisplayContextProvider>

		</Workbench>
	)
}
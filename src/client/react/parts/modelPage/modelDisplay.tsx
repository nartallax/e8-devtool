import {Api} from "client/api_client"
import {buildObjectShapeByImage} from "client/pages/model/model_display/auto_shape"
import {Button} from "client/react/components/button/button"
import {Checkbox} from "client/react/components/checkbox/checkbox"
import {TooltipIcon} from "client/react/components/overlayItem/tooltipIcon"
import {Col, Row} from "client/react/components/rowCol/rowCol"
import {Sidebar, SidebarLayout} from "client/react/components/sidebarLayout/sidebarLayout"
import {Workbench} from "client/react/components/workbench/workbench"
import {ModelDecompLayer} from "client/react/parts/modelPage/modelDecompLayer"
import {ModelDisplayContextProvider, useModelDisplayContext} from "client/react/parts/modelPage/modelDisplayContext"
import {ModelGridLayer} from "client/react/parts/modelPage/modelGridLayer"
import {ModelShapeLayer} from "client/react/parts/modelPage/modelShapesLayer"
import {ModelTextureLayer} from "client/react/parts/modelPage/modelTextureLayer"
import {useProjectContext} from "client/react/parts/projectContext"
import {UUID, getRandomUUID} from "common/uuid"
import {ProjectShape} from "data/project"
import {Icon} from "generated/icons"

type Props = {
	readonly modelId: UUID
}

export const ModelDisplay = ({modelId}: Props) => {
	const {isLoaded} = useProjectContext()
	if(!isLoaded){
		return null
	}

	return (
		<ModelDisplayContextProvider modelId={modelId}>
			<SidebarLayout>
				<Sidebar>
					<ModelSidebar/>
				</Sidebar>
				<ModelWorkbench/>
			</SidebarLayout>

		</ModelDisplayContextProvider>
	)
}

const ModelSidebar = () => {
	// TODO: move isShowing... from context to state in parent control
	// just to avoid re-rendering workbench stuff
	const {currentlyDrawnShapeId, setCurrentlyDrawnShapeId, setSelectedShapeId, isShowingShapes, setShowShapes, isShowingDecomp, setShowDecomp, isShowingGrid, setShowGrid, updateShapes, model, sizeMultiplier, roundToGrain, shapesStateStack, getShapes} = useModelDisplayContext()

	const startShapeDrawing = () => {
		const shape: ProjectShape = {id: getRandomUUID(), points: []}
		updateShapes(shapes => [...shapes, shape])
		setCurrentlyDrawnShapeId(shape.id)
		setSelectedShapeId(shape.id)
	}

	const addAutoShape = async() => {
		const texUrl = Api.getTextureUrl(model.texturePath)
		let points = await buildObjectShapeByImage(texUrl, model.size.x, model.size.y, sizeMultiplier)
		points = points.map(point => roundToGrain(point))
		const shape: ProjectShape = {id: getRandomUUID(), points: points.map(p => [p.x, p.y])}
		updateShapes(shapes => [...shapes, shape])
		shapesStateStack.storeState(getShapes())
		setSelectedShapeId(shape.id)
	}

	return (
		<>
			<Col>
				<Checkbox label="Show shapes" value={isShowingShapes} onChange={setShowShapes}/>
				<Checkbox label="Show decomp" value={isShowingDecomp} onChange={setShowDecomp}/>
				<Checkbox label="Show grid" value={isShowingGrid} onChange={setShowGrid}/>
			</Col>
			<Row gap>
				<TooltipIcon
					icon={Icon.questionCircle}
					tooltipCorner="top-left"
					iconCorner="top-right"
					isPreWrapped>
					Click to select/deselect a polygon.
					<br/>
					Drag to move a point.
					<br/>
					Use arrow keys to move last moved point one step at a time.
					<br/>
					Ctrl+click on free space or point to add or remove point from selected polygon.
					<br/>
					Use Delete key to remove selected polygon.
				</TooltipIcon>
				<Button
					text="Draw shape"
					icon={Icon.plus}
					isDisabled={currentlyDrawnShapeId !== null || !isShowingShapes}
					onClick={startShapeDrawing}
				/>
				<Button
					text="Autoshape"
					icon={Icon.plus}
					isDisabled={currentlyDrawnShapeId !== null || !isShowingShapes}
					onClick={addAutoShape}
				/>
			</Row>
		</>
	)
}

const ModelWorkbench = () => {
	const {sizeMultiplier, model, isShowingShapes, isShowingDecomp, isShowingGrid} = useModelDisplayContext()

	return (
		<Workbench
			width={model.size.x * sizeMultiplier}
			height={model.size.y * sizeMultiplier}
			maxZoom={10}
			minZoom={0.1}
			initialZoom={0.25}>
			{isShowingGrid && <ModelGridLayer/>}
			{/* TODO: have a boolean for that one too */}
			<ModelTextureLayer/>
			{isShowingDecomp && <ModelDecompLayer/>}
			{isShowingShapes && <ModelShapeLayer/>}
		</Workbench>
	)
}
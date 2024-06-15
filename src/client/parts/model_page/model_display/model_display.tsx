import {Button} from "client/components/button/button"
import {CheckboxField} from "client/components/checkbox/checkbox"
import {NumberInputField} from "client/components/number_input/number_input"
import {TooltipIcon} from "client/components/overlay_item/tooltip_icon"
import {Row} from "client/components/row_col/row_col"
import {Sidebar, SidebarLayout} from "client/parts/layouts/sidebar_layout"
import {Workbench} from "client/components/workbench/workbench"
import {buildObjectShapeByImage} from "client/parts/model_page/auto_shape"
import {CollisionGroupsModal} from "client/parts/collision_groups/collision_groups_modal"
import {LayersModal} from "client/parts/layers/layers_modal"
import {ModelDecompLayer} from "client/parts/model_page/model_display/model_decomp_layer"
import {ModelDisplayContextProvider, useModelDisplayContext} from "client/parts/model_page/model_display/model_display_context"
import {ModelGridLayer} from "client/parts/model_page/model_display/model_grid_layer"
import {ModelShapeLayer} from "client/parts/model_page/model_display/model_shapes_layer"
import {ModelTextureLayer} from "client/parts/model_page/model_display/model_texture_layer"
import {TexturesModal} from "client/parts/textures/textures_modal"
import {NamedIdSelector} from "client/parts/named_id_selector/named_id_selector"
import {useProject} from "client/parts/project_context"
import {useTextures} from "client/parts/texture_tree_context"
import {UUID, getRandomUUID} from "common/uuid"
import {ProjectShape} from "data/project"
import {Icon} from "generated/icons"
import {useRef} from "react"

type Props = {
	readonly modelId: UUID
}

export const ModelDisplay = ({modelId}: Props) => {
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
	const [project] = useProject()
	// TODO: move isShowing... from context to state in parent control
	// just to avoid re-rendering workbench stuff
	const {currentlyDrawnShapeId, setCurrentlyDrawnShapeId, setSelectedShapeId, isShowingShapes, setShowShapes, isShowingDecomp, setShowDecomp, isShowingGrid, setShowGrid, updateShapes, model, sizeMultiplier, roundToGrain, shapesStateStack, getShapes, setModel} = useModelDisplayContext()
	const {getTextureUrl} = useTextures()

	const startShapeDrawing = () => {
		const shape: ProjectShape = {id: getRandomUUID(), points: []}
		updateShapes(shapes => [...shapes, shape])
		setCurrentlyDrawnShapeId(shape.id)
		setSelectedShapeId(shape.id)
	}

	const addAutoShape = async() => {
		const texUrl = getTextureUrl(model.textureId)
		let points = await buildObjectShapeByImage(texUrl, model.size.x, model.size.y, sizeMultiplier)
		points = points.map(point => roundToGrain(point))
		const shape: ProjectShape = {id: getRandomUUID(), points: points.map(p => [p.x, p.y])}
		updateShapes(shapes => [...shapes, shape])
		shapesStateStack.storeState(getShapes())
		setSelectedShapeId(shape.id)
	}

	const lastNonInfiniteModelSize = useRef(model.size)
	const setModelSize = (x: number, y: number) => {
		const {x: oldX, y: oldY} = lastNonInfiniteModelSize.current
		const multX = x / oldX
		const multY = y / oldY

		// avoid to just collapse all the shapes into single dot at 0,0
		if(multX > 0 && multY > 0 && Number.isFinite(multX) && Number.isFinite(multY) && (multX !== 1 || multY !== 1)){
			lastNonInfiniteModelSize.current = {x, y}
			updateShapes(shapes => shapes.map(shape => ({...shape, points: shape.points.map(([x, y]) => {
				const {x: newX, y: newY} = roundToGrain({x: x * multX, y: y * multY})
				return [newX, newY]
			})})))
		}
		setModel(model => ({...model, size: {x, y}}))
	}

	const {textureFiles} = useTextures()

	return (
		<>
			<NamedIdSelector
				label="Texture"
				values={textureFiles}
				value={model.textureId}
				onChange={textureId => setModel(model => ({...model, textureId}))}
				modal={onClose => <TexturesModal onClose={onClose} value={model.textureId}/>}
			/>
			<NamedIdSelector
				label="Collision"
				values={project.collisionGroups}
				value={model.collisionGroupId}
				onChange={collisionGroupId => setModel(model => ({...model, collisionGroupId}))}
				modal={onClose => <CollisionGroupsModal onClose={onClose} value={model.collisionGroupId}/>}
			/>
			<NamedIdSelector
				label="Layer"
				values={project.layers}
				value={model.layerId}
				onChange={layerId => setModel(model => ({...model, layerId}))}
				modal={onClose => <LayersModal onClose={onClose} value={model.layerId} layerType='model'/>}
			/>
			<CheckboxField label="Is static" value={model.isStatic} onChange={isStatic => setModel(model => ({...model, isStatic}))}/>
			<NumberInputField
				label="Width"
				value={model.size.x}
				min={0}
				// no strong basis for this value, it's just for sizes to look better
				step={0.01}
				onChange={x => setModelSize(x, model.size.y)}
			/>
			<NumberInputField
				label="Height"
				value={model.size.y}
				min={0}
				step={0.01}
				onChange={y => setModelSize(model.size.x, y)}
			/>
			<CheckboxField label="Show shapes" value={isShowingShapes} onChange={setShowShapes}/>
			<CheckboxField label="Show decomp" value={isShowingDecomp} onChange={setShowDecomp}/>
			<CheckboxField label="Show grid" value={isShowingGrid} onChange={setShowGrid}/>
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
	const {sizeMultiplier, model, isShowingShapes, isShowingDecomp, isShowingGrid, workbenchRef} = useModelDisplayContext()

	return (
		<Workbench
			contextRef={workbenchRef}
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
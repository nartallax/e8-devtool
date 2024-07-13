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
import {ModelShapeLayer} from "client/parts/model_page/model_display/model_shapes_layer/model_shapes_layer"
import {ModelTextureLayer} from "client/parts/model_page/model_display/model_texture_layer"
import {TexturesModal} from "client/parts/textures/textures_modal"
import {useTextures} from "client/parts/texture_tree_context"
import {UUID, getRandomUUID} from "common/uuid"
import {ProjectShape} from "data/project"
import {Icon} from "generated/icons"
import {useRef} from "react"
import {SetState} from "client/ui_utils/react_types"
import {useLocalStorageState} from "client/ui_utils/use_local_storage_state"
import {TitlePart} from "client/components/title_context/title_context"
import {ForestPathSelector} from "client/parts/forest_path_selector/forest_path_selector"
import {StringForestIdSelector} from "client/parts/string_forest_id_selector/string_forest_id_selector"
import {collisionGroupProvider, layerProvider, modelProvider, projectConfigProvider} from "client/parts/data_providers/data_providers"
import {UnsavedChanges} from "client/components/unsaved_changes_context/unsaved_changes_context"

type Props = {
	modelId: UUID
}

export const ModelDisplay = ({modelId}: Props) => {
	const [isShowingDecomp, setShowDecomp] = useLocalStorageState("modelDisplay.isShowingDecomp", false)
	const [isShowingShapes, setShowShapes] = useLocalStorageState("modelDisplay.isShowingShapes", false)
	const [isShowingGrid, setShowGrid] = useLocalStorageState("modelDisplay.isShowingGrid", true)
	const [isShowingTexture, setShowTexture] = useLocalStorageState("modelDisplay.isShowingTexture", true)

	const editable = modelProvider.useEditableItem(modelId)
	const config = projectConfigProvider.useData()
	if(!editable || !config){
		return null
	}

	return (
		<UnsavedChanges {...editable.changesProps}>
			<ModelDisplayContextProvider model={editable.value} setModel={editable.setValue} projectConfig={config}>
				<SidebarLayout>
					<Sidebar>
						<ModelSidebar
							isShowingDecomp={isShowingDecomp}
							isShowingGrid={isShowingGrid}
							isShowingShapes={isShowingShapes}
							isShowingTexture={isShowingTexture}
							setShowDecomp={setShowDecomp}
							setShowGrid={setShowGrid}
							setShowShapes={setShowShapes}
							setShowTexture={setShowTexture}
						/>
					</Sidebar>
					<ModelWorkbench
						isShowingDecomp={isShowingDecomp}
						isShowingGrid={isShowingGrid}
						isShowingShapes={isShowingShapes}
						isShowingTexture={isShowingTexture}
					/>
				</SidebarLayout>
			</ModelDisplayContextProvider>
		</UnsavedChanges>
	)
}

type SidebarProps = {
	isShowingDecomp: boolean
	setShowDecomp: SetState<boolean>
	isShowingShapes: boolean
	setShowShapes: SetState<boolean>
	isShowingGrid: boolean
	setShowGrid: SetState<boolean>
	isShowingTexture: boolean
	setShowTexture: SetState<boolean>
}

const ModelSidebar = ({
	isShowingDecomp, setShowDecomp, isShowingGrid, isShowingShapes, setShowGrid, setShowShapes, isShowingTexture, setShowTexture
}: SidebarProps) => {
	const {
		currentlyDrawnShapeId, setCurrentlyDrawnShapeId, setSelectedShapeId, updateShapes, model, roundToGrain, shapesStateStack, getShapes, setModel, modelName, inworldUnitPixelSize
	} = useModelDisplayContext()
	const {getTextureUrl} = useTextures()

	const startShapeDrawing = () => {
		const shape: ProjectShape = {id: getRandomUUID(), points: []}
		updateShapes(shapes => [...shapes, shape])
		setCurrentlyDrawnShapeId(shape.id)
		setSelectedShapeId(shape.id)
	}

	const addAutoShape = async() => {
		const texUrl = getTextureUrl(model.texturePath)
		const resolution = inworldUnitPixelSize * 10 // this allows for better quality
		let points = await buildObjectShapeByImage(texUrl, model.size.x, model.size.y, resolution)
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
			updateShapes(shapes => shapes.map(shape => ({
				...shape, points: shape.points.map(([x, y]) => {
					const {x: newX, y: newY} = roundToGrain({x: x * multX, y: y * multY})
					return [newX, newY]
				})
			})))
		}
		setModel(model => ({...model, size: {x, y}}))
	}

	const {textureTree} = useTextures()


	return (
		<TitlePart part={" - " + modelName}>
			<ForestPathSelector
				label="Texture"
				forest={textureTree}
				value={model.texturePath}
				onChange={texturePath => setModel(model => ({...model, texturePath}))}
				modal={onClose => <TexturesModal onClose={onClose} value={model.texturePath}/>}
			/>
			<StringForestIdSelector
				provider={collisionGroupProvider}
				label="Collision"
				value={model.collisionGroupId}
				onChange={collisionGroupId => setModel(model => ({...model, collisionGroupId}))}
				modal={(path, onClose) => <CollisionGroupsModal path={path} onClose={onClose}/>}
			/>
			<StringForestIdSelector
				provider={layerProvider}
				label="Layer"
				value={model.layerId}
				onChange={layerId => setModel(model => ({...model, layerId}))}
				modal={(path, onClose) => <LayersModal onClose={onClose} value={path} layerType='model'/>}
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
			<CheckboxField label="Show texture" value={isShowingTexture} onChange={setShowTexture}/>
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
		</TitlePart>
	)
}

type WorkbenchProps = {
	isShowingDecomp: boolean
	isShowingShapes: boolean
	isShowingGrid: boolean
	isShowingTexture: boolean
}

const ModelWorkbench = ({
	isShowingDecomp, isShowingGrid, isShowingShapes, isShowingTexture
}: WorkbenchProps) => {
	const {model, workbenchRef, inworldUnitPixelSize} = useModelDisplayContext()

	return (
		<Workbench
			contextRef={workbenchRef}
			width={model.size.x * inworldUnitPixelSize}
			height={model.size.y * inworldUnitPixelSize}
			maxZoom={100}
			minZoom={1}
			initialZoom={4}>
			{isShowingGrid && <ModelGridLayer/>}
			{isShowingTexture && <ModelTextureLayer/>}
			{isShowingDecomp && <ModelDecompLayer/>}
			{isShowingShapes && <ModelShapeLayer/>}
		</Workbench>
	)
}
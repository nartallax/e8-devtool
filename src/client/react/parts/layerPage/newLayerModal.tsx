import {LayerType} from "@nartallax/e8"
import {Button} from "client/react/components/button/button"
import {SubmitButton} from "client/react/components/button/submitButton"
import {Form} from "client/react/components/form/form"
import {Validators} from "client/react/components/form/validators"
import {Modal} from "client/react/components/modal/modal"
import {Col, Row} from "client/react/components/rowCol/rowCol"
import {Select, SelectOption} from "client/react/components/select/select"
import {TextInput} from "client/react/components/textInput/textInput"
import {useProject} from "client/react/parts/projectContext"
import {getRandomUUID} from "common/uuid"
import {UUID} from "crypto"
import {LayerDefinition, Project} from "data/project"
import {useState} from "react"

type Props = {
	readonly onClose: (newLayer?: LayerDefinition) => void
}

const layerTypeOptions: SelectOption<LayerType>[] = [
	{label: "model", value: "model"},
	{label: "particle", value: "particle"}
]

export const getLayerNameValidators = (project: Project, editedLayerId?: UUID) => {
	let layers = project.layers
	if(editedLayerId){
		layers = layers.filter(layer => layer.id !== editedLayerId)
	}
	return [
		Validators.nonEmpty(),
		Validators.isUnique({values: layers.map(layer => layer.name)})
	]
}

export const NewLayerModal = ({onClose}: Props) => {
	const [layerType, setLayerType] = useState<LayerType | null>(null)
	const [name, setName] = useState("")
	const [project] = useProject()
	return (
		<Modal header="New layer" onClose={onClose} contentWidth="350px">
			<Form
				onSubmit={() => onClose({
					id: getRandomUUID(),
					name,
					type: layerType!
				})}>
				<Col gap align="stretch">
					<Select
						label="Layer type"
						options={layerTypeOptions}
						value={layerType}
						onChange={setLayerType}
						validators={[Validators.nonEmpty()]}/>
					<TextInput
						label="Layer name"
						placeholder="My New Layer"
						isAutofocused
						value={name}
						onChange={setName}
						validators={getLayerNameValidators(project)}/>
					<Row justify="end" gap>
						<Button text="Cancel" onClick={onClose}/>
						<SubmitButton/>
					</Row>
				</Col>
			</Form>
		</Modal>
	)
}
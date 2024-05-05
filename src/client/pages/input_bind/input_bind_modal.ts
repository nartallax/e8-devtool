import {RBox, WBox, box, calcBox, isArrayItemWBox} from "@nartallax/cardboard"
import {onMount} from "@nartallax/cardboard-dom"
import {project} from "client/client_globals"
import {Button} from "client/component/button/button"
import {showModal} from "client/component/modal/modal"
import {Row} from "client/component/row_col/row_col"
import {TextInput} from "client/component/text_input/text_input"
import {TreeView} from "client/component/tree_view/tree_view"
import {showInputGroupsModal} from "client/pages/input_bind/input_groups_modal"
import {ProjectInputBind} from "data/project"
import {InputKey, Chord, chordToString, fixChord, knownMouseButtonInputs} from "@nartallax/e8"
import {BoolInput} from "client/component/bool_input/bool_input"

interface Props {
	readonly bind: WBox<ProjectInputBind>
}

export const showInputBindModal = async(props: Props): Promise<void> => {
	let idCounter = 0

	const chords = props.bind.prop("defaultChords")

	const chordsTree = chords.map(
		chords => chords.map(chord => ({value: {chord: chord, id: ++idCounter}})),
		trees => trees.map(tree => tree.value.chord)
	)

	const isReceivingInput = box(false)
	let receivingInputFor: WBox<Chord> | null = null

	const inputGroupId = props.bind.prop("group")
	const inputGroups = project.prop("inputGroups")
	const selectedInputGroup = calcBox(
		[inputGroups, inputGroupId],
		(inputGroups, inputGroupId) => inputGroups.find(x => x.id === inputGroupId)
	)

	const modal = showModal({
		title: props.bind.prop("name").map(name => `Edit input bind: ${name}`),
		width: "400px",
		height: "400px",
		align: "stretch",
		gap: true
	}, [
		TextInput({
			placeholder: "Input bind name",
			value: props.bind.prop("name")
		}),
		Row({justify: "start", gap: true}, [
			Button({
				text: "Add chord",
				onClick: () => {
					chords.appendElement([])
					receivingInputFor = chords.getArrayContext((_, i) => i).getBoxForKey(chords.get().length - 1)
					isReceivingInput.set(true)
				}
			}),
			Button({
				text: selectedInputGroup.map(group => "Input group: " + (!group ? "<none>" : group.name)),
				onClick: () => showInputGroupsModal({selectedGroup: inputGroupId})
			}),
			"Is hold:",
			BoolInput({value: props.bind.prop("isHold")})
		]),
		TreeView({
			data: chordsTree,
			getId: tree => tree.value.id,
			isFlat: true,
			getRowLabel: treeBox => treeBox.map(tree => chordToString(tree.value.chord)),
			onDelete: row => {
				if(receivingInputFor){
					receivingInputFor = null
					isReceivingInput.set(false)
				}
				if(isArrayItemWBox(row)){
					row.deleteArrayElement()
				}
			},
			onEdit: row => {
				receivingInputFor = row.prop("value").prop("chord")
				isReceivingInput.set(true)
			}
		}),
		isReceivingInput.map(isReceiving => !isReceiving ? null : "Receiving input!")
	])

	bindChordReceiving(modal.root,
		isReceivingInput,
		(chord, shouldStop) => {
			if(!receivingInputFor){
				return
			}
			chord = fixChord(chord)
			receivingInputFor.set(chord)
			if(shouldStop){
				receivingInputFor = null
				isReceivingInput.set(false)
			}
		}
	)

	await modal.waitClose()
}


function bindChordReceiving(root: HTMLElement, isEnabled: RBox<boolean>, receive: (chord: Chord, shouldStop: boolean) => void): void {
	const downKeys = new Set<InputKey>()
	const keysPressedThisSession = new Set<InputKey>()

	onMount(root, () => {
		const onInputKeyDown = (e: MouseEvent | KeyboardEvent, input: InputKey) => {
			if(!isEnabled.get()){
				return
			}
			downKeys.add(input)
			keysPressedThisSession.add(input)
			e.preventDefault()
			e.stopPropagation()
			receive([...keysPressedThisSession], false)
		}

		const onInputKeyUp = (e: MouseEvent | KeyboardEvent, input: InputKey) => {
			if(!downKeys.has(input)){
				return
			}

			if(!isEnabled.get()){
				return
			}
			e.preventDefault()
			e.stopPropagation()

			downKeys.delete(input)
			if(downKeys.size === 0){
				receive([...keysPressedThisSession], true)
				keysPressedThisSession.clear()
			}
		}

		const keyDownHandler = (e: KeyboardEvent) => onInputKeyDown(e, e.code as InputKey)
		const keyUpHandler = (e: KeyboardEvent) => onInputKeyUp(e, e.code as InputKey)
		const mouseDownHandler = (e: MouseEvent) => onInputKeyDown(e, knownMouseButtonInputs[e.button]!)
		const mouseUpHandler = (e: MouseEvent) => onInputKeyUp(e, knownMouseButtonInputs[e.button]!)
		const mouseWheelHandler = (e: WheelEvent) => {
			const input = e.deltaY > 0 ? "WheelDown" : "WheelUp"
			onInputKeyDown(e, input)
			onInputKeyUp(e, input)
		}

		window.addEventListener("keydown", keyDownHandler)
		window.addEventListener("keyup", keyUpHandler)
		window.addEventListener("mousedown", mouseDownHandler)
		window.addEventListener("mouseup", mouseUpHandler)
		window.addEventListener("wheel", mouseWheelHandler, {passive: false})

		return () => {
			window.removeEventListener("keydown", keyDownHandler)
			window.removeEventListener("keyup", keyUpHandler)
			window.removeEventListener("mousedown", mouseDownHandler)
			window.removeEventListener("mouseup", mouseUpHandler)
			window.removeEventListener("wheel", mouseWheelHandler)
		}
	}, {ifInDom: "call"})
}
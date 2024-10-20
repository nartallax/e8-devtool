import {Chord, InputKey, browserKeyboardCodeToInputKey, knownMouseButtonInputs} from "@nartallax/e8"
import {useCallback, useEffect, useRef} from "react"
import * as css from "./chord_input.module.css"
import {cn} from "client/ui_utils/classname"

type Props = {
	value: Chord
	onChange: (value: Chord, isComplete: boolean) => void
	variant?: "default" | "inline"
}

export const chordToString = (chord: Chord) => chord.join("+")
export const chordFromString = (str: string) => str.split("+") as Chord


export const ChordInput = ({value, onChange, variant = "default"}: Props) => {
	const ref = useRef<HTMLInputElement | null>(null)

	const downKeysRef = useRef(new Set<InputKey>())
	const keysPressedThisSessionRef = useRef(new Set<InputKey>())

	const updateAndChange = useCallback((chord: Chord, isComplete: boolean) => {
		if(ref.current){
			ref.current.value = chordToString(chord)
		}
		onChange(chord, isComplete)
	}, [onChange])

	useEffect(() => {
		ref.current?.focus()

		const downKeys = downKeysRef.current
		const keysPressedThisSession = keysPressedThisSessionRef.current

		const onInputKeyDown = (e: MouseEvent | KeyboardEvent, input: InputKey) => {
			downKeys.add(input)
			keysPressedThisSession.add(input)
			e.preventDefault()
			e.stopPropagation()
			updateAndChange([...keysPressedThisSession], false)
		}

		const onInputKeyUp = (e: MouseEvent | KeyboardEvent, input: InputKey) => {
			if(!downKeys.has(input)){
				return
			}

			e.preventDefault()
			e.stopPropagation()

			downKeys.delete(input)
			if(downKeys.size === 0){
				updateAndChange([...keysPressedThisSession], true)
				keysPressedThisSession.clear()
			}
		}

		const keyDownHandler = (e: KeyboardEvent) => {
			const key = browserKeyboardCodeToInputKey(e.code)
			if(key !== null){
				onInputKeyDown(e, key)
			}
		}
		const keyUpHandler = (e: KeyboardEvent) => {
			const key = browserKeyboardCodeToInputKey(e.code)
			if(key !== null){
				onInputKeyUp(e, key)
			}
		}
		const mouseDownHandler = (e: MouseEvent) => {
			const key = knownMouseButtonInputs[e.button]
			if(key !== undefined){
				onInputKeyDown(e, key)
			}
		}
		const mouseUpHandler = (e: MouseEvent) => {
			const key = knownMouseButtonInputs[e.button]
			if(key !== undefined){
				onInputKeyUp(e, key)
			}
		}
		const mouseWheelHandler = (e: WheelEvent) => {
			const input = e.deltaY > 0 ? "WheelDown" : "WheelUp"
			onInputKeyDown(e, input)
			onInputKeyUp(e, input)
		}

		window.addEventListener("keydown", keyDownHandler, {capture: true})
		window.addEventListener("keyup", keyUpHandler, {capture: true})
		window.addEventListener("mousedown", mouseDownHandler, {capture: true})
		window.addEventListener("mouseup", mouseUpHandler, {capture: true})
		window.addEventListener("wheel", mouseWheelHandler, {passive: false, capture: true})

		return () => {
			window.removeEventListener("keydown", keyDownHandler, {capture: true})
			window.removeEventListener("keyup", keyUpHandler, {capture: true})
			window.removeEventListener("mousedown", mouseDownHandler, {capture: true})
			window.removeEventListener("mouseup", mouseUpHandler, {capture: true})
			window.removeEventListener("wheel", mouseWheelHandler, {capture: true})
		}
	}, [updateAndChange])

	return (
		<input
			ref={ref}
			defaultValue={chordToString(value)}
			className={cn(css.chordInput, {
				[css.defaultVariant!]: variant === "default",
				[css.inlineVariant!]: variant === "inline"
			})}
		/>
	)
}
import {Chord} from "@nartallax/e8"
import {ChordInput, chordFromString, chordToString} from "client/react/parts/chordInput/chordInput"
import {useState} from "react"

type Props = {
	readonly initialValue: string
	readonly onComplete: (value: string | null) => void
}

export const InlineTreeChordEditor = ({initialValue, onComplete}: Props) => {
	const [chord, setChord] = useState(chordFromString(initialValue))

	const onChange = (chord: Chord, isComplete: boolean) => {
		setChord(chord)
		if(isComplete){
			onComplete(chord.length === 0 ? null : chordToString(chord))
		}
	}

	return <ChordInput value={chord} onChange={onChange} variant="inline"/>
}
import {Hotkey} from "client/components/hotkey_context/hotkey_context"
import {TextInput} from "client/components/text_input/text_input"
import {useWaitForInput} from "client/ui_utils/use_wait_for_input"
import {Icon} from "generated/icons"
import {useEffect, useRef} from "react"

type Props = {
	onChange: (value: string) => void
	onAccept?: () => void
	isDisabled?: boolean
	placeholder?: string
	isAutofocused?: boolean
	inputWaitTime?: number // ms
}

export const SearchInput = ({inputWaitTime = 0, onChange, onAccept, isAutofocused, isDisabled, placeholder}: Props) => {
	const wrappedOnChange = useWaitForInput(inputWaitTime, onChange)

	const onKeyDown = (e: React.KeyboardEvent) => {
		if(e.code === "Escape"){
			wrappedOnChange.cancel()
			if(ref.current){
				ref.current.value = ""
			}
			onChange("")
		} else if(e.code === "Enter"){
			if(onAccept){
				onAccept()
			}
		}
	}

	const ref = useRef<HTMLInputElement | null>(null)

	useEffect(() => {
		if(isAutofocused){
			ref.current?.focus()
		}
	}, [isAutofocused, ref])

	return (
		<Hotkey
			shouldPick={e => e.code === "KeyF" && e.ctrlKey}
			onPress={e => {
				e.preventDefault()
				ref.current?.focus()
			}}>
			<TextInput
				isDisabled={isDisabled}
				placeholder={placeholder}
				value=""
				onChange={wrappedOnChange}
				icon={Icon.lookingGlass}
				onKeyDown={onKeyDown}
				inputRef={ref}
			/>
		</Hotkey>
	)
}
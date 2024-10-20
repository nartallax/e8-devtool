import {cn} from "client/ui_utils/classname"
import {MutableRefObject, ReactNode, useEffect, useRef} from "react"
import * as css from "./text_input.module.css"
import {Icon} from "generated/icons"
import {Button} from "client/components/button/button"
import {nodeOrParentThatMatches} from "client/ui_utils/dom_queries"

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> & {
	value: string
	onChange: (value: string) => void
	isDisabled?: boolean
	inputRef: MutableRefObject<HTMLInputElement | null>
	hasError?: boolean
	icon?: Icon
	onIconClick?: () => void
}

export const TextInput = ({
	value, onChange, onIconClick, isDisabled, inputRef: ref, hasError, icon, ...props
}: Props) => {
	const lastValue = useRef(value)
	const handleChange = () => {
		const input = ref.current
		if(input && input.value !== lastValue.current){
			lastValue.current = input.value
			onChange(input.value)
		}
	}

	useEffect(() => {
		if(lastValue.current !== value && ref.current){
			lastValue.current = value
			ref.current.value = value
		}
	}, [value, ref])

	let iconEl: ReactNode = null
	if(icon){
		if(!onIconClick){
			iconEl = <div className={cn(icon, css.textInputIcon)}/>
		} else {
			iconEl = (
				<div className={css.textInputIconButtonWrap}>
					<Button
						onClick={onIconClick}
						icon={icon}
						variant="large-plain-icon"
					/>
				</div>
			)
		}
	}

	return (
		<div
			className={css.textInputBaseWrap}
			onClick={e => {
				if(e.target instanceof HTMLElement && nodeOrParentThatMatches(e.target, node => node instanceof HTMLButtonElement)){
					return
				}
				ref.current?.focus()
			}}>
			{iconEl}
			<input
				ref={ref}
				className={cn(css.textInputBase, {[css.hasError!]: hasError})}
				type="text"
				defaultValue={value}
				disabled={isDisabled}
				onPaste={handleChange}
				onBlur={handleChange}
				onKeyDown={handleChange}
				onKeyUp={handleChange}
				onChange={handleChange}
				{...props}
			/>
		</div>
	)
}
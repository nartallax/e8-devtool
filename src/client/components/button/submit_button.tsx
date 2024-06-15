import {Button} from "client/components/button/button"
import {useFormContext} from "client/components/form/form_context"
import {ComponentProps} from "react"

type Props = Omit<ComponentProps<typeof Button>, "onClick" | "type">

export const SubmitButton = ({isDisabled, ...props}: Props) => {
	const {submit, hasErrors, isShowingErrors} = useFormContext()
	return (
		<Button
			{...props}
			type="submit"
			text={props.text ?? "OK"}
			isDisabled={(isShowingErrors && hasErrors) || isDisabled}
			hotkey={props.hotkey ?? (e => e.key === "Enter")}
			onClick={submit}
		/>
	)
}
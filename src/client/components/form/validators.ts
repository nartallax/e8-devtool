import {Validator} from "client/components/form/form_context"

export type ValidatorsMaybeFactory<T, V> = Validator<T>[] | ((value: V) => (Validator<T>[] | undefined))

export function resolveValidatorsMaybeFactory<T, V>(validators: ValidatorsMaybeFactory<T, V> | undefined, value: V): Validator<T>[] | undefined {
	if(typeof(validators) === "function"){
		return validators(value)
	} else {
		return validators
	}
}

export namespace Validators {
	export const nonEmpty = <T>({defaultValue}: {defaultValue?: T} = {}): Validator<T> =>
		value => {
			if(value === null || value === undefined || value === defaultValue || value === ""){
				return "This field cannot be empty."
			}

			return null
		}

	export const isUnique = <T>({values}: {values: readonly T[]}): Validator<T> => {
		const set = new Set(values)
		return value => {
			if(set.has(value)){
				return "This value must be unique."
			}

			return null
		}
	}
}
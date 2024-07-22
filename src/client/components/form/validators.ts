import {Validator} from "client/components/form/form_context"
import {pathPartRegexp} from "common/regexps"

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

	export const isUnique = <T>({values}: {values: T[]}): Validator<T> => {
		const set = new Set(values)
		return value => {
			if(set.has(value)){
				return "This value must be unique."
			}

			return null
		}
	}

	export const isPathPart = (): Validator<string> => value => {
		if(typeof(value) !== "string" || !pathPartRegexp.test(value)){
			return "This value is not a path part."
		}

		return null
	}
}

export namespace ValidatorSets {
	export const nonEmpty = [Validators.nonEmpty()]
	export const path = [Validators.isPathPart()]
}
export const pluralize = <T extends string>(word: T, count: number): `${T}s` | T => {
	return word + (count > 1 ? "s" : "") as `${T}s` | T
}
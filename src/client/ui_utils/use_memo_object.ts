import {useMemo} from "react"

export const useMemoObject = <T extends Record<string, unknown>>(obj: T): T => {
	// eslint-disable-next-line react-hooks/exhaustive-deps
	return useMemo(() => obj, Object.values(obj))
}
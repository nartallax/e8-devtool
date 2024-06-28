import {useMemo, useRef} from "react"

export const useRevision = (...deps: unknown[]): number => {
	const lastRevision = useRef(1)
	return useMemo(() => {
		return lastRevision.current++
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, deps)
}
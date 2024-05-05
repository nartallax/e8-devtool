export function errToStack(e: unknown): string {
	return (e instanceof Error ? e.stack || e.message || e : e) + ""
}

export function errToString(e: unknown): string {
	return (e instanceof Error ? e.message || e : e) + ""
}
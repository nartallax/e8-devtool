export const appendUrlPath = (base: URL, path: string): URL => {
	if(!base.pathname.endsWith("/")){
		base = new URL(base.pathname + "/", base.origin)
	}
	if(path.startsWith("/")){
		path = "." + path
	}
	return new URL(path, base)
}

export const pushHistory = (url: URL) => {
	window.history.pushState(null, "", url)
}
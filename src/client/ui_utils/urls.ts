export const appendUrlPath = (base: URL, path: string): URL => {
	if(!base.pathname.endsWith("/")){
		base = new URL(base.pathname + "/", base.origin)
	}
	if(path.startsWith("/")){
		path = "." + path
	}
	return new URL(path, base)
}

export const mergeUrls = (...urls: (URL | string)[]): URL => {
	if(urls.length === 0){
		return new URL(window.location.origin)
	}

	let base = resolveUrl(urls[0]!)
	for(let i = 1; i < urls.length; i++){
		const nextUrl = resolveUrl(urls[i]!)

		if((nextUrl.pathname || "/") !== "/"){
			if(!base.pathname.endsWith("/")){
				base = new URL(base.pathname + "/" + base.search, base.origin)
			}
			base = new URL(nextUrl.pathname + base.search, base.origin)
		}

		if(nextUrl.search){
			const searchParams = new URLSearchParams(base.searchParams)
			nextUrl.searchParams.forEach((value, key) => searchParams.set(key, value))
			base = new URL(base.pathname + "?" + searchParams, base.origin)
		}
	}

	return base
}

const resolveUrl = (url: URL | string): URL => {
	if(typeof(url) === "string"){
		return new URL(url, window.location.origin)
	} else {
		return url
	}
}


// TODO: don't. use routing context utils
export const pushHistory = (url: URL) => {
	window.history.pushState(null, "", url)
}
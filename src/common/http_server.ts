import * as Http from "http"
import * as Path from "path"
import * as Fs from "fs"
import {errToStack} from "common/err_to_string"
import {isPathInsidePath} from "common/is_path_inside_path"
import {httpGet} from "common/http_request"
import {isEnoent} from "common/is_enoent"
import {readStreamToBuffer} from "common/read_stream_to_buffer"
import {ApiError, ApiResponse, errorToErrorApiResp} from "common/api_response"
import {log} from "common/log"
import * as MimeTypes from "mime-types"

interface StaticRoute {
	/** URL (in case of proxy) or path (in case of filesystem directory) is expected */
	readonly url: string
	/** True here will enable client-side cacheing of any resources in the directory */
	readonly isCacheable?: boolean
	/** Sometimes it's not possible to understand the mime type from URL/path alone
	 * (for example, in case of smart stuff about routing mime type should be text/html, but URL path will lack extension)
	 * To account for those cases, this property exists
	 *
	 * If absent, default is application/octet-stream, which is completely unsuggestive for most of the http clients */
	readonly defaultMimeType?: string
}

interface HttpServerOptions {
	readonly port: number
	/** Host is mandatory to avoid accidently exposing localhost the server to outside world */
	readonly host: string
	/** Map of request path prefixes -> description of route */
	readonly static: Readonly<Record<string, StaticRoute>>
	/** Part of path that precedes all of the API calls */
	readonly apiRoot: string
	readonly apiMethods: {
		readonly [name: string]: (...args: unknown[]) => (unknown | Promise<unknown>)
	}
	readonly inputSizeLimit: number
	readonly readTimeoutSeconds: number
}

if(Math.random() > 1){
	// this helps with weird parcel bug about http
	console.log(Http)
}

/** A generic HTTP server.
 * Can serve static from url or path, and also call APIs. */
export class HttpServer {
	private readonly server: Http.Server

	constructor(private readonly opts: HttpServerOptions) {
		this.server = new Http.Server((req, res) => this.processRequest(req, res))
	}

	start(): Promise<string> {
		return new Promise((ok, bad) => {
			this.server.listen(this.opts.port, this.opts.host, () => {
				const addr = this.server.address()
				if(!addr || typeof(addr) !== "object"){
					bad(new Error("Server address is not an object: " + addr))
					return
				}
				ok(`http://${this.opts.host ?? addr.address}:${addr.port}`)
			})
		})
	}

	stop(): Promise<void> {
		return new Promise((ok, bad) => this.server.close(err => err ? bad(err) : ok()))
	}

	private async processRequest(req: Http.IncomingMessage, res: Http.ServerResponse): Promise<void> {
		try {
			req.on("error", err => console.error("Error on HTTP request: " + errToStack(err)))
			res.on("error", err => console.error("Error on HTTP response: " + errToStack(err)))

			const method = (req.method || "").toUpperCase()
			if(!method){
				return await endRequest(res, 400, "Where Is The Method Name You Fucker")
			}

			const urlStr = req.url || "/"
			const hostHeader = req.headers.host
			if(!hostHeader){
				return await endRequest(res, 400, "Where Is The Host Header I Require It To Be Present")
			}
			const url = new URL(urlStr, "http://localhost")
			const path = url.pathname

			if(path.startsWith(this.opts.apiRoot)){
				if(method !== "GET" && method !== "POST" && method !== "PUT"){
					await endRequest(res, 405, "Your HTTP Method Name Sucks")
				}
				await this.processApiRequest(url, req, res)
			} else {
				switch(method){
					case "GET":
						await this.processStaticRequest(path, res)
						return
					default:
						await endRequest(res, 400, "What The Fuck Do You Want From Me")
						return
				}
			}
		} catch(e){
			console.error(errToStack(e))
			await endRequest(res, 500, "We Fucked Up", "UwU")
		}
	}

	private async processStaticRequest(path: string, res: Http.ServerResponse): Promise<void> {
		let longestMatchingPrefix = ""
		for(const prefix of Object.keys(this.opts.static)){
			if(prefix.length > longestMatchingPrefix.length && path.startsWith(prefix)){
				longestMatchingPrefix = prefix
			}
		}
		path = path.substring(longestMatchingPrefix.length)

		const route = this.opts.static[longestMatchingPrefix]
		if(route === undefined){
			await endRequest(res, 404, "No Such Directory Or Path Or Whatever")
			return
		}

		if(isUrl(route.url)){
			await this.processStaticRequestByProxy(path, route, res)
		} else {
			await this.processStaticRequestByFile(path, route, res)
		}
	}

	private addStaticHeaders(route: StaticRoute, path: string, res: Http.ServerResponse, preventCache: boolean): void {
		if(path.toLowerCase().endsWith(".html") || preventCache){
			// never store the html
			res.setHeader("Cache-Control", "max-age=0, no-store")
		} else {
			res.setHeader("Cache-Control", "public,max-age=31536000,immutable")
		}
		const dfltMime = route.defaultMimeType ?? "application/octet-stream"
		const mime = MimeTypes.lookup(path) || dfltMime
		const contentType = MimeTypes.contentType(mime) || dfltMime
		res.setHeader("Content-Type", contentType)
	}

	private resolveStaticFileName(path: string, root: string): string {
		if(path.endsWith("/") || path === ""){
			path += "index.html"
		}

		if(path.startsWith("/")){ // probably
			path = "." + path
		}
		if(isUrl(root)){
			let url = new URL(root, "http://localhost")
			url = new URL(path, url)
			path = url.pathname
		} else {
			path = Path.resolve(root, path)
			if(!isPathInsidePath(path, root)){
				throw new Error("Weird request path not inside root dir: " + path)
			}
		}

		return path
	}


	private async processStaticRequestByProxy(path: string, route: StaticRoute, res: Http.ServerResponse): Promise<void> {
		const resolvedUrl = new URL(path, route.url)
		const result = await httpGet(resolvedUrl)
		this.addStaticHeaders(route, this.resolveStaticFileName(path, route.url), res, !route.isCacheable)
		res.end(result)
	}

	private async processStaticRequestByFile(resourcePath: string, route: StaticRoute, res: Http.ServerResponse): Promise<void> {
		resourcePath = this.resolveStaticFileName(resourcePath, route.url)

		try {
			const readStream = Fs.createReadStream(resourcePath)
			this.addStaticHeaders(route, resourcePath, res, !route.isCacheable)
			readStream.pipe(res)
			await waitReadStreamToEnd(readStream)
			await waitRequestEnd(res)
		} catch(e){
			if(isEnoent(e)){
				await endRequest(res, 404, "No Such File You Fool")
			} else {
				throw e
			}
		}

	}

	private async getApiBody(req: Http.IncomingMessage, url: URL): Promise<unknown[]> {
		// this is not very common, and is in fact remnant from one of the previous project
		// here we assume that only PUT/GET endpoints will ever need query params, which is wrong
		// but whatever
		if(req.method === "GET" || req.method === "PUT"){
			const argsObj: Record<string, unknown> = {}
			for(const [k, v] of url.searchParams.entries()){
				argsObj[k] = v
			}
			if(req.method === "PUT"){
				argsObj["data"] = await readStreamToBuffer(req, this.opts.inputSizeLimit, this.opts.readTimeoutSeconds * 1000)
			}
			return [argsObj]
		}

		const body = await readStreamToBuffer(req, this.opts.inputSizeLimit, this.opts.readTimeoutSeconds * 1000)
		const args = JSON.parse(body.toString("utf-8")) ?? []
		if(!Array.isArray(args)){
			throw new Error("POST body args, if present, must be contained in array")
		}
		return args
	}

	private async processApiRequest(url: URL, req: Http.IncomingMessage, res: Http.ServerResponse): Promise<void> {
		const methodName = url.pathname.substring(this.opts.apiRoot.length)
		const apiMethod = Object.hasOwn(this.opts.apiMethods, methodName) ? this.opts.apiMethods[methodName] : null
		if(!apiMethod){
			return await endRequest(res, 404, "Your Api Call Sucks")
		}

		const methodArgs = await this.getApiBody(req, url)

		let callResult: unknown = null
		let error: Error | null = null
		log(`API call: ${methodName}`)
		try {
			callResult = await Promise.resolve(apiMethod(...methodArgs))
		} catch(e){
			if(e instanceof Error){
				const err: Error = e
				const errStr = ApiError.isApiError(err) ? err.message : err.stack || err.message
				log(`Error calling ${methodName}(${apiMethodArgsToString(methodArgs ?? [])}): ${errStr}`)
				error = err
			} else {
				throw e
			}
		}

		let resp: string | Buffer
		if(error){
			resp = JSON.stringify(errorToErrorApiResp(error))
			await endRequest(res, 500, "Server Error", resp)
		} else {
			if(callResult instanceof Buffer){
				resp = callResult
			} else {
				const apiResp: ApiResponse<unknown> = {result: callResult ?? null}
				resp = JSON.stringify(apiResp)
			}
			await endRequest(res, 200, "OK", resp)
		}
	}

}

function isUrl(x: string): boolean {
	return x.toLowerCase().startsWith("http")
}

function waitRequestEnd(res: Http.ServerResponse): Promise<void> {
	return new Promise(ok => res.end(ok))
}

function endRequest(res: Http.ServerResponse, code: number, codeStr: string, body: string | Buffer = "OwO", headers?: Record<string, string>): Promise<void> {
	return new Promise(ok => {
		res.writeHead(code, codeStr, headers)
		if(typeof(body) === "string"){
			res.end(body, "utf-8", ok)
		} else {
			res.end(body, ok)
		}
	})
}

function waitReadStreamToEnd(stream: Fs.ReadStream): Promise<void> {
	return new Promise((ok, bad) => {
		stream.on("error", e => bad(e))
		stream.on("end", () => ok())
	})
}

export function apiMethodArgsToString(methodArgs: unknown[]): string {
	return methodArgs.map(value => value instanceof Uint8Array ? "<binary>" : JSON.stringify(value)).join(", ")
}
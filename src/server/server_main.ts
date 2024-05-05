import {getApi} from "server/api"
import {getConfig} from "server/config"
import {HttpServer} from "common/http_server"
import {log} from "common/log"
import * as Process from "process"
import * as open from "open"
import {getActions} from "server/actions"

async function main(): Promise<void> {
	log("Starting...")
	const config = await getConfig()

	if(config.generate){
		await getActions(config).produceEverything()
		return
	}

	const server = new HttpServer({
		port: config.port,
		host: config.host ?? "localhost",
		static: {
			"/": {url: config.html, defaultMimeType: "text/html"},
			"/textures/": {url: config.textureDirectoryPath}
		},
		inputSizeLimit: 8 * 1024 * 1024,
		readTimeoutSeconds: 180,
		apiRoot: "/api/",
		apiMethods: getApi(config)
	})

	const addr = await server.start()
	log("Started, UI should be available at " + addr)

	if(!config.noStartOpen){
		void open.default(addr)
	}
}

async function mainWrapped(): Promise<void> {
	try {
		await main()
	} catch(e){
		console.error(e instanceof Error ? e.stack : e + "")
		Process.exit(1)
	}
}

void mainWrapped()
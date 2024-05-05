import {getPromanApi} from "server/proman_api"
import {getPromanConfig} from "server/proman_config"
import {HttpServer} from "common/http_server"
import {log} from "common/log"
import * as Process from "process"
import * as open from "open"
import {getPromanActions} from "server/proman_actions"

async function main(): Promise<void> {
	log("Starting...")
	const config = await getPromanConfig()

	if(config.generate){
		await getPromanActions(config).produceEverything()
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
		apiMethods: getPromanApi(config)
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
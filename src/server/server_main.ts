import {getApi} from "server/api"
import {HttpServer} from "common/http_server"
import {log} from "common/log"
import * as Process from "process"
import * as open from "open"
import {getCliArgs} from "server/cli"
import {getActions} from "server/actions"
import {batchJsonApiCalls} from "server/batcher"
import {errToString} from "common/err_to_string"

// TODO: forbid parcel to auto-install browser implementations for node APIs and modules
// (I sometimes import them on accident, then remove them, but the installed module stays there, which sucks)
// after that - clean up autoinstalled modules

async function main(): Promise<void> {
	log("Starting...")
	const cli = getCliArgs()
	const actions = await getActions(cli)

	if(cli.generate){
		await actions.produceEverything()
		return
	}

	const server = new HttpServer({
		port: cli.port,
		host: cli.host ?? "localhost",
		static: {
			"/": {url: cli.html, defaultMimeType: "text/html"},
			"/project_file/": {url: actions.projectRoot}
		},
		inputSizeLimit: 8 * 1024 * 1024,
		readTimeoutSeconds: 180,
		apiRoot: "/api/",
		apiMethods: batchJsonApiCalls(getApi(actions))
	})

	const addr = await server.start()
	log("Started, UI should be available at " + addr)

	if(!cli.noStartOpen){
		void open.default(addr)
	}
}

async function mainWrapped(): Promise<void> {
	try {
		await main()
	} catch(e){
		console.error(errToString(e))
		Process.exit(1)
	}
}

void mainWrapped()
import {getApi} from "server/api"
import {HttpServer, HttpStaticRoute} from "common/http_server"
import {log} from "common/log"
import * as Process from "process"
import * as open from "open"
import {CLIArgs, getCliArgs} from "server/cli"
import {Project} from "data/project"
import {DevtoolActions, getActions} from "server/actions"
import {batchJsonApiCalls} from "server/batcher"

async function main(): Promise<void> {
	log("Starting...")
	const cli = getCliArgs()
	const actions = getActions(cli)

	if(cli.generate){
		await actions.produceEverything()
		return
	}

	const staticRoutes: Record<string, HttpStaticRoute> = await(async() => {
		const project = await actions.getProject()
		const result: Record<string, HttpStaticRoute> = {}
		updateStaticRoutes(cli, result, project, actions)
		return result
	})()

	const server = new HttpServer({
		port: cli.port,
		host: cli.host ?? "localhost",
		static: staticRoutes,
		inputSizeLimit: 8 * 1024 * 1024,
		readTimeoutSeconds: 180,
		apiRoot: "/api/",
		apiMethods: batchJsonApiCalls(getApi(cli, project => updateStaticRoutes(cli, staticRoutes, project, actions)))
	})

	const addr = await server.start()
	log("Started, UI should be available at " + addr)

	if(!cli.noStartOpen){
		void open.default(addr)
	}
}

const updateStaticRoutes = (cli: CLIArgs, routes: Record<string, HttpStaticRoute>, project: Project, actions: DevtoolActions) => {
	routes["/"] = {url: cli.html, defaultMimeType: "text/html"}
	routes["/textures/"] = {url: actions.resolveProjectPath(project.config.textureDirectoryPath)}
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
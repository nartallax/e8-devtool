import {CLI} from "@nartallax/cli"
import * as Path from "path"

const cli = CLI.define({
	helpHeader: "Developer tool for E8 game engine.",
	options: {
		html: CLI.str({
			keys: ["--html"],
			isHidden: true,
			description: "Path to a directory, or URL, that contains HTML and other browser-related devtool files. Mostly meant for development of the tool itself; for other purposes tool comes with its own client.",
			default: Path.resolve(Path.dirname(process.argv[1] ?? "."), "./client/")
		}),
		generate: CLI.bool({
			keys: ["--generate"],
			description: "Generate everything that can be generated from project definition and exit."
		}),
		noStartOpen: CLI.bool({
			keys: ["--no-start-open"],
			description: "By default the tool will open its UI in default browser after start. Pass this option to prevent this behaviour."
		}),
		port: CLI.port({
			keys: ["--port"],
			description: "TCP port on which UI will be available. Defaults to 24765.",
			default: 24765
		}),
		host: CLI.str({
			keys: ["--host"],
			description: "Host name on which UI will be available. Defaults to localhost.",
			default: "localhost"
		}),
		projectPath: CLI.path({
			keys: ["--project"],
			description: "Path to a file that will hold definition of the project, and also serve as point where relative paths are calculated from. Choose location of this file wisely, as in this project you won't be able to reference files outside directory that project definition file is in. If file does not exist - empty one will be generated."
		})
	}
})

export type CLIArgs = CLI.ArgsByDefinition<typeof cli>

export function getCliArgs(): CLIArgs {
	return cli.parse()
}
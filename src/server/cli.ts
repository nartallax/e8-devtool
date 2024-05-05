import {CLI} from "@nartallax/cli"
import * as Path from "path"

const cli = CLI.define({
	helpHeader: "Webserver for picgen web GUI",
	options: {
		help: CLI.help({
			keys: ["-h", "--h", "-help", "--help"],
			description: "Display help and exit"
		}),
		html: CLI.str({
			keys: ["--html"],
			description: "Path to directory, or URL, that contains HTML and other browser-related devtool files. Mostly meant for development of the tool itself; for other purposes tool comes with its own client.",
			default: Path.resolve(Path.dirname(process.argv[1] ?? "."), "./client/")
		}),
		configPath: CLI.path({
			keys: ["--config"],
			description: "Path to configuration file that describes the project."
		}),
		generate: CLI.bool({
			keys: ["--generate"],
			description: "Generate everything that can be generated from project definition and exit."
		}),
		noStartOpen: CLI.bool({
			keys: ["--no-start-open"],
			description: "By default the tool will open its UI in default browser after start. Pass this option to prevent this behaviour."
		})
	}
})

export type CLIArgs = CLI.ArgsByDefinition<typeof cli>

export function getCliArgs(): CLIArgs {
	return cli.parse()
}
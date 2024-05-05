import {CLI, CliArgObject} from "common/cli"
import * as Path from "path"

const cli = new CLI({
	helpHeader: "Webserver for picgen web GUI",
	definition: {
		help: CLI.help({
			keys: ["-h", "--h", "-help", "--help"],
			definition: "Display help and exit"
		}),
		html: CLI.str({
			keys: ["--html"],
			definition: "Path to directory, or URL, that contains HTML and other browser-related devtool files. Mostly meant for development of the tool itself; for other purposes tool comes with its own client.",
			default: Path.resolve(Path.dirname(process.argv[1] ?? "."), "./client/")
		}),
		configPath: CLI.path({
			keys: ["--config"],
			definition: "Path to configuration file that describes the project."
		}),
		generate: CLI.bool({
			keys: ["--generate"],
			definition: "Generate everything that can be generated from project definition and exit."
		}),
		noStartOpen: CLI.bool({
			keys: ["--no-start-open"],
			definition: "By default the tool will open its UI in default browser after start. Pass this option to prevent this behaviour."
		})
	}
})

export type CLIArgs = CliArgObject<typeof cli>

export function getCliArgs(): CLIArgs {
	return cli.parseArgs()
}
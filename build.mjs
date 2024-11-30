import {buildUtils} from "@nartallax/ts-build-utils"

const {
	npm, clear, typecheck, build: buildServer, watch: watchServer, copyToTarget, cutPackageJson, addNodeShebang, startJsProcess, runTests
} = buildUtils({
	defaultBuildOptions: {
		entryPoints: ["./src/server/e8-devtool.ts"],
		bundle: true,
		sourcemap: false,
		platform: "node",
		packages: "external",
		format: "esm"
	}
})

const {build: buildClient, serve: serveClient, buildIconFont} = buildUtils({
	target: "target/client",
	defaultBuildOptions: {
		entryPoints: ["./src/client/index.html"],
		bundle: true,
		platform: "browser",
		packages: "bundle",
		format: "esm",
		assetNames: "[name]-[hash]",
		entryNames: "[name]",
		chunkNames: "[name]-[hash]",
		loader: {
			".ttf": "copy",
			".woff2": "copy",
			".png": "file",
			".svg": "file"
		},
		sourcemap: true
	},
	iconFont: {
		svgDir: "./src/icons",
		cssPath: "./src/generated/icons.css",
		fontPath: "./src/generated/icons",
		tsPath: "./src/generated/icons.ts",
		tsCssImportStyle: "star",
		tsName: "Icon",
		isFontNormalized: true,
		fontDescent: 150
	}
})

const linkE8 = () => npm.link({
	paths: ["../e8/target"],
	skipIfPresent: true
})

const main = async mode => {
	switch(mode){
		case "typecheck": {
			await typecheck()
		} break

		case "build": {
			await clear()
			await linkE8()
			await buildClient({minify: true})
			await buildServer()
			await copyToTarget("README.md", "LICENSE")
			await cutPackageJson()
			await addNodeShebang()
			console.log("Done.")
		} break

		case "icons": {
			await buildIconFont()
		} break

		case "test": {
			await clear()
			await linkE8()
			await runTests({ nameFilter: process.argv[3] })
		} break

		case "development": {
			await clear()
			await linkE8()

			let serverProcess = null
			await watchServer({
				onBuildEnd: async() => {
					if(!serverProcess){
						serverProcess = startJsProcess({args: [
							"--html", 'http://localhost:24658',
							"--no-start-open",
							"--project-root", process.env.E8_DEVTOOL_PROJECT_ROOT
						]})
						serverProcess = await serverProcess
					} else {
						serverProcess?.restartIfChanged?.()
					}
				}
			})

			await serveClient({port: 24658})
		} break
	}
}

void main(process.argv[2])